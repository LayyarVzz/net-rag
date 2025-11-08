import { Module } from '@nestjs/common';
import { RagModule } from './rag/rag.module';
import { ConfigModule } from '@nestjs/config';
import { IngestModule } from './docs/ingest/ingest.module';
import { UploadModule } from './docs/upload/upload.module';
import { ParseDocModule } from './docs/parse-doc/parse-doc.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    //RagModule,
    IngestModule,
    UploadModule,
    ParseDocModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
