import { Module } from '@nestjs/common';
import { RagModule } from './rag/rag.module';
import { ConfigModule } from '@nestjs/config';
import { IngestModule } from './docs/ingest/ingest.module';
import { UploadModule } from './docs/upload/upload.module';

@Module({
  imports: [
    RagModule,
    ConfigModule.forRoot(),
    IngestModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
