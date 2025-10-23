import { Test, TestingModule } from '@nestjs/testing';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding/embedding.service';
import { QdrantService } from './qdrant/qdrant.service';
import { LlmService } from './llm/llm.service';
import { QdrantModule } from './qdrant/qdrant.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { LlmModule } from './llm/llm.module';

describe('RagController', () => {
  let controller: RagController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EmbeddingModule, QdrantModule, LlmModule],
      controllers: [RagController],
      providers: [
        RagService,
        {
          provide: EmbeddingService,
          useValue: {
            embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
          },
        },
        {
          provide: QdrantService,
          useValue: {},
        },
        {
          provide: LlmService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<RagController>(RagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});