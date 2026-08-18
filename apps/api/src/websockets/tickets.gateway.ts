import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as cookie from 'cookie';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const cookies = cookie.parse(client.handshake.headers.cookie || '');
      const token = cookies['access_token'];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      
      // Optionally join rooms based on role
      if (payload.papel === 'AGENTE' || payload.papel === 'ADMIN') {
        client.join('ti_team');
      } else {
        client.join(`user_${payload.sub}`);
      }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // nothing to do
  }

  // Helper methods to emit events
  emitTicketCreated(ticket: any) {
    console.log("===================================");
    console.log("Emitindo ticketCreated:", ticket.titulo, ticket.id);
    this.server.to('ti_team').emit('ticketCreated', ticket);
    this.server.to(`user_${ticket.criadoPorId}`).emit('ticketCreated', ticket);
    console.log("Evento emitido com sucesso para ti_team e user_" + ticket.criadoPorId);
    console.log("===================================");
  }

  emitTicketUpdated(ticket: any) {
    this.server.to('ti_team').emit('ticketUpdated', ticket);
    this.server.to(`user_${ticket.criadoPorId}`).emit('ticketUpdated', ticket);
  }

  emitCommentCreated(comment: any, ticketCriadoPorId: string) {
    this.server.to('ti_team').emit('commentCreated', comment);
    
    // Colaboradores não devem receber notas internas via WebSocket
    if (!comment.isNotaInterna) {
      this.server.to(`user_${ticketCriadoPorId}`).emit('commentCreated', comment);
    }
  }
}
