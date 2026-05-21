import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AlertsService } from '../alerts/alerts.service';

@WebSocketGateway({ namespace: '/stream', cors: { origin: true, credentials: true } })
export class StreamingGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // cameraId → set of phone socket IDs currently streaming
  private streamers = new Map<string, Set<string>>();

  constructor(private readonly alertsService: AlertsService) {}

  async handleDisconnect(client: Socket) {
    const cameraId = client.data.cameraId as string | undefined;
    if (!cameraId) return;

    this.streamers.get(cameraId)?.delete(client.id);

    // If no more streamers for this camera, it is effectively disconnected
    const remaining = this.streamers.get(cameraId)?.size ?? 0;
    if (remaining === 0) {
      const alert = await this.alertsService.createInternalAlert({
        typeName: 'camera_disconnected',
        camaraId: Number(cameraId),
      });

      if (alert) {
        // Notify all dashboard clients watching this camera
        this.server.emit('alert:new', {
          id: alert.id,
          cameraId: Number(cameraId),
          type: 'camera_disconnected',
          creadoEn: alert.creadoEn,
        });
      }
    }
  }

  @SubscribeMessage('stream:join')
  joinAsPhone(@ConnectedSocket() client: Socket, @MessageBody() cameraId: string) {
    client.data.cameraId = cameraId;
    if (!this.streamers.has(cameraId)) this.streamers.set(cameraId, new Set());
    this.streamers.get(cameraId)!.add(client.id);
    client.join(`camera:${cameraId}`);
    return { ok: true };
  }

  @SubscribeMessage('stream:watch')
  joinAsOperator(@ConnectedSocket() client: Socket, @MessageBody() cameraIds: string[]) {
    for (const id of cameraIds) {
      client.join(`camera:${id}`);
    }
    return { ok: true };
  }

  @SubscribeMessage('stream:frame')
  relayFrame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { cameraId: string; frame: string },
  ) {
    client.to(`camera:${payload.cameraId}`).emit('stream:frame', payload);
  }
}
