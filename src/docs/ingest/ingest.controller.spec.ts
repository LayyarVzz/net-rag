// ingest.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { QdrantService } from '../../rag/qdrant/qdrant.service';

// 复用已有的 mockQdrantService
const mockQdrantService = {
  addDocuments: jest.fn(),
};

// 创建 IngestService 的 mock 实现
const mockIngestService = {
  ingest: jest.fn(),
};

describe('IngestController', () => {
  let controller: IngestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
      providers: [
        {
          provide: IngestService,
          useValue: mockIngestService,
        },
        {
          provide: QdrantService,
          useValue: mockQdrantService,
        },
      ],
    }).compile();

    controller = module.get<IngestController>(IngestController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadAndIngest', () => {
    it('should process uploaded file successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('# Test Content'),
        originalname: 'test.md',
        mimetype: 'text/markdown',
      } as Express.Multer.File;
      
      mockIngestService.ingest.mockResolvedValue(undefined);
      
      const result = await controller.uploadAndIngest(mockFile);
      
      expect(result).toEqual({
        message: '文件处理成功',
        filename: 'test.md',
      });
      expect(mockIngestService.ingest).toHaveBeenCalled();
    });

    it('should throw HttpException when no file provided', async () => {
      await expect(controller.uploadAndIngest(undefined))
        .rejects
        .toThrow('未提供文件');
    });

    it('should throw HttpException for non-md files', async () => {
      const mockFile = {
        buffer: Buffer.from('plain text'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      } as Express.Multer.File;
      
      await expect(controller.uploadAndIngest(mockFile))
        .rejects
        .toThrow('只支持 Markdown 文件 (.md)');
    });

    it('should throw HttpException when ingestion fails', async () => {
      const mockFile = {
        buffer: Buffer.from('# Test Content'),
        originalname: 'test.md',
        mimetype: 'text/markdown',
      } as Express.Multer.File;
      
      mockIngestService.ingest.mockRejectedValue(new Error('Processing failed'));
      
      await expect(controller.uploadAndIngest(mockFile))
        .rejects
        .toThrow('文件处理失败');
    });
  });
});