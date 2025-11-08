import { Test, TestingModule } from '@nestjs/testing';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { Document } from '@langchain/core/documents';
import { HttpException, HttpStatus } from '@nestjs/common';

// 在模块顶部直接定义 mock 对象，不依赖函数
const mockVectorStore = {
  addDocuments: jest.fn(),
  similaritySearch: jest.fn(),
};

// Mock 整个 @langchain/qdrant 模块
jest.mock('@langchain/qdrant');

describe('QdrantService', () => {
  let qdrantService: QdrantService;

  beforeEach(async () => {
    // 在每次测试前设置 mock 行为
    const { QdrantVectorStore } = require('@langchain/qdrant');
    QdrantVectorStore.fromExistingCollection.mockResolvedValue(mockVectorStore);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QdrantService,
        {
          provide: EmbeddingService,
          useValue: {
            embedQuery: jest.fn(),
            embedDocuments: jest.fn(),
          },
        },
      ],
    }).compile();

    qdrantService = module.get<QdrantService>(QdrantService);

    // 设置环境变量
    process.env.QDRANT_URL = 'http://localhost:6333';
    process.env.QDRANT_COLLECTION_NAME = 'test_collection';

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.QDRANT_URL;
    delete process.env.QDRANT_COLLECTION_NAME;
  });

  it('should be defined', () => {
    expect(qdrantService).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize vector store successfully', async () => {
      await qdrantService.onModuleInit();
      expect(qdrantService['vectorStore']).toBe(mockVectorStore);
    });

    it('should throw HttpException when initialization fails', async () => {
      const { QdrantVectorStore } = require('@langchain/qdrant');
      QdrantVectorStore.fromExistingCollection.mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      await expect(qdrantService.onModuleInit()).rejects.toThrow(
        new HttpException(
          'Qdrant向量数据库初始化失败,请稍后再试',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('addDocuments', () => {
    beforeEach(async () => {
      await qdrantService.onModuleInit();
    });

    it('should add documents successfully', async () => {
      const documents: Document[] = [
        new Document({
          pageContent: '测试文档内容',
          metadata: { source: 'test' },
        }),
      ];

      mockVectorStore.addDocuments.mockResolvedValueOnce(undefined);

      await expect(
        qdrantService.addDocuments(documents),
      ).resolves.toBeUndefined();
      expect(mockVectorStore.addDocuments).toHaveBeenCalledWith(documents);
    });

    it('should throw HttpException when adding documents fails', async () => {
      const documents: Document[] = [
        new Document({
          pageContent: '测试文档内容',
          metadata: { source: 'test' },
        }),
      ];

      mockVectorStore.addDocuments.mockRejectedValueOnce(
        new Error('Add failed'),
      );

      await expect(qdrantService.addDocuments(documents)).rejects.toThrow(
        new HttpException(
          '添加文档到Qdrant失败,请稍后再试',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('similaritySearch', () => {
    beforeEach(async () => {
      await qdrantService.onModuleInit();
    });

    it('should perform similarity search successfully', async () => {
      const query = '测试查询';
      const k = 4;
      const mockResults = [
        new Document({
          pageContent: '搜索结果内容',
          metadata: { source: 'result' },
        }),
      ];

      mockVectorStore.similaritySearch.mockResolvedValueOnce(mockResults);

      const result = await qdrantService.similaritySearch(query, k);

      expect(result).toEqual(mockResults);
      expect(mockVectorStore.similaritySearch).toHaveBeenCalledWith(query, k);
    });

    it('should throw HttpException when similarity search fails', async () => {
      const query = '测试查询';
      const k = 4;

      mockVectorStore.similaritySearch.mockRejectedValueOnce(
        new Error('Search failed'),
      );

      await expect(qdrantService.similaritySearch(query, k)).rejects.toThrow(
        new HttpException(
          '相似性搜索失败，请稍后再试',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});