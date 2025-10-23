import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { QdrantModule } from './qdrant/qdrant.module';
import { LlmModule } from './llm/llm.module';

describe('RagService', () => {
  let service: RagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EmbeddingModule, QdrantModule, LlmModule],
      providers: [RagService],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
