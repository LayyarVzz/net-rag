import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './embedding/embedding.service'
import { QdrantService } from './qdrant/qdrant.service';
import { LlmService } from './llm/llm.service';


@Injectable()
export class RagService {
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly qdrant: QdrantService,
    private readonly llm: LlmService,
  ) { }

  getName() {
    return this.embedding.name();
  }
}
