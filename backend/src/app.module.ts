import { Module } from '@nestjs/common';
import { YjsModule } from './yjs/yjs.module';

@Module({
  imports: [YjsModule],
})
export class AppModule {}
