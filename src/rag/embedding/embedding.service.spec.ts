import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import { Logger } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';

// 模拟 OpenAIEmbeddings
const mockOpenAIEmbeddings = {
  embedDocuments: jest.fn(),
  embedQuery: jest.fn(),
};

jest.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => mockOpenAIEmbeddings),
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingService],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    logger = new Logger(EmbeddingService.name);

    // 在每个测试前重置所有模拟
    jest.clearAllMocks();

    // 使用模拟的 embeddings 初始化服务
    await service.onModuleInit();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('应该使用正确的配置初始化 OpenAIEmbeddings', async () => {
      // 保存原始环境变量
      const originalEnv = process.env;

      // 模拟 process.env
      process.env = {
        ...originalEnv,
        EMBEDDING_MODEL: 'text-embedding-ada-002',
        BASE_URL: 'https://api.openai.com/v1',
        API_KEY: 'test-api-key',
      };

      // 创建新实例来测试 onModuleInit
      const newService = new EmbeddingService();
      await newService.onModuleInit();

      expect(OpenAIEmbeddings).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        configuration: {
          baseURL: 'https://api.openai.com/v1',
          apiKey: 'test-api-key'
        },
        encodingFormat: 'float'
      });

      // 恢复原始环境变量
      process.env = originalEnv;
    });
  });

  describe('embedDocuments', () => {
    it('应该成功嵌入文档', async () => {
      const testChunks = ['Hello world', 'Test document'];
      const mockEmbeddingsResult = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6]
      ];

      mockOpenAIEmbeddings.embedDocuments.mockResolvedValue(mockEmbeddingsResult);

      const result = await service.embedDocuments(testChunks);

      expect(result).toEqual(mockEmbeddingsResult);
      expect(mockOpenAIEmbeddings.embedDocuments).toHaveBeenCalledWith(testChunks);
    });

    it('应该处理嵌入错误并抛出 HttpException', async () => {
      const testChunks = ['Hello world'];
      const errorMessage = 'OpenAI API error';

      mockOpenAIEmbeddings.embedDocuments.mockRejectedValue(new Error(errorMessage));

      await expect(service.embedDocuments(testChunks)).rejects.toThrow('文档嵌入处理失败，请稍后再试');
      expect(mockOpenAIEmbeddings.embedDocuments).toHaveBeenCalledWith(testChunks);
    });
  });

  describe('embedQuery', () => {
    it('应该成功嵌入查询', async () => {
      const testQuery = 'What is NestJS?';
      const mockEmbeddingResult = [0.1, 0.2, 0.3];

      mockOpenAIEmbeddings.embedQuery.mockResolvedValue(mockEmbeddingResult);

      const result = await service.embedQuery(testQuery);

      expect(result).toEqual(mockEmbeddingResult);
      expect(mockOpenAIEmbeddings.embedQuery).toHaveBeenCalledWith(testQuery);
    });

    it('应该处理查询嵌入错误并抛出 HttpException', async () => {
      const testQuery = 'What is NestJS?';
      const errorMessage = 'OpenAI API error';

      mockOpenAIEmbeddings.embedQuery.mockRejectedValue(new Error(errorMessage));

      await expect(service.embedQuery(testQuery)).rejects.toThrow('查询嵌入处理失败，请稍后再试');
      expect(mockOpenAIEmbeddings.embedQuery).toHaveBeenCalledWith(testQuery);
    });
  });
});