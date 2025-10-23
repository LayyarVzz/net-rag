import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { QdrantModule } from './qdrant/qdrant.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { LlmModule } from './llm/llm.module';

@Module({
  controllers: [RagController],
  providers: [RagService],
  imports: [QdrantModule, EmbeddingModule, LlmModule],
})
export class RagModule { }
