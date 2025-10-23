import { Test, TestingModule } from '@nestjs/testing';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { QdrantModule } from './qdrant/qdrant.module';
import { LlmModule } from './llm/llm.module';

describe('RagController', () => {
  let controller: RagController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EmbeddingModule, QdrantModule, LlmModule],
      controllers: [RagController],
      providers: [RagService],
    }).compile();

    controller = module.get<RagController>(RagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
