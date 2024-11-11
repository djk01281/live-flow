import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'YJS 서버 실행 중 🚀';
  }
}
