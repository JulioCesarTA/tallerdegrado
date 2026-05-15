import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/stream', cors: { origin: true, credentials: true } })
export class StreamingGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // cameraId → set of phone socket IDs currently streaming
  private streamers = new Map<string, Set<string>>();

  handleDisconnect(client: Socket) {
    const cameraId = client.data.cameraId as string | undefined;
    if (cameraId) {
      this.streamers.get(cameraId)?.delete(client.id);
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
    // Relay JPEG base64 frame to all operators watching this camera (excluding the sender)
    client.to(`camera:${payload.cameraId}`).emit('stream:frame', payload);
  }
}
