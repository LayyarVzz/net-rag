import { Module } from '@nestjs/common';
import { QdrantService } from './qdrant.service';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [EmbeddingModule],
  providers: [QdrantService],
  exports: [QdrantService],
})
export class QdrantModule { }
