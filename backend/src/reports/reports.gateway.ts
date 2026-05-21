import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ReportsService } from './reports.service';

@WebSocketGateway({ namespace: '/reports', cors: { origin: true, credentials: true } })
export class ReportsGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly reportsService: ReportsService) {}

  @SubscribeMessage('reports:subscribe')
  async handleSubscribe(client: Socket) {
    client.join('reports-room');
    const data = await this.reportsService.getOverview();
    client.emit('reports:data', data);
  }

  async broadcastUpdate() {
    const data = await this.reportsService.getOverview();
    this.server.to('reports-room').emit('reports:data', data);
  }
}
