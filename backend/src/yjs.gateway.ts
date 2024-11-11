// src/yjs.gateway.ts
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Logger } from '@nestjs/common';

@WebSocketGateway(1234, {
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class YjsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('YjsGateway');

  afterInit(server: Server) {
    this.logger.log(`"서버 실행 중 🚀`);
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    this.logger.log(`클라이언트 접속: ${client.url}`);
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log(`클라이언트 접속 해제: ${client.url}`);
  }
}
