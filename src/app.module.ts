import { Module } from '@nestjs/common';
import { EmbeddingModule } from './embedding/embedding.module';
import { VectorStoreModule } from './vector-store/vector-store.module';
import { RagModule } from './rag/rag.module';
import { ConfigModule } from '@nestjs/config';
import { IngestModule } from './docs/ingest/ingest.module';
import { UploadModule } from './docs/upload/upload.module';

@Module({
  imports: [
    EmbeddingModule,
    VectorStoreModule,
    RagModule,
    ConfigModule.forRoot(),
    IngestModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
