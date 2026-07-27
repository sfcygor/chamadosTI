import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/attachments')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('ticketId') ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.uploadsService.saveAttachment(ticketId, file);
  }
}
