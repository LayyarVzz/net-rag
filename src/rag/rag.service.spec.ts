import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding/embedding.service';
import { QdrantService } from './qdrant/qdrant.service';
import { LlmService } from './llm/llm.service';

describe('RagService', () => {
  let service: RagService;
  let embeddingService: EmbeddingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: EmbeddingService,
          useValue: {
            embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
            embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
          },
        },
        {
          provide: QdrantService,
          useValue: {
            // 可以在这里添加 qdrant 服务的方法模拟
          },
        },
        {
          provide: LlmService,
          useValue: {
            // 可以在这里添加 llm 服务的方法模拟
          },
        },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    embeddingService = module.get<EmbeddingService>(EmbeddingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEmbedQuery', () => {
    it('应该调用 embedding service 的 embedQuery 方法', async () => {
      const testQuery = '测试查询';
      const mockResult = [0.1, 0.2, 0.3];

      jest.spyOn(embeddingService, 'embedQuery').mockResolvedValue(mockResult);

      const result = await service.getEmbedQuery(testQuery);

      expect(result).toEqual(mockResult);
      expect(embeddingService.embedQuery).toHaveBeenCalledWith(testQuery);
    });
  });
});