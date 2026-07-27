import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../common/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => {
  const SetMetadata = require('@nestjs/common').SetMetadata;
  return SetMetadata(ROLES_KEY, roles);
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => user.papel === role);

    if (!hasRole) {
      throw new ForbiddenException('Permissão insuficiente para esta ação');
    }

    return true;
  }
}
