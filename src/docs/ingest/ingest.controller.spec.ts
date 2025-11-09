// ingest.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { QdrantService } from '../../rag/qdrant/qdrant.service';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

import * as fs from 'fs';

// 复用已有的 mockQdrantService
const mockQdrantService = {
  addDocuments: jest.fn(),
};

// 创建 IngestService 的 mock 实现
const mockIngestService = {
  ingest: jest.fn(),
  splitMarkdown: jest.fn(),
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

    // Clear all mocks before each test
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

  describe('test', () => {
    it('should return error response when filePath is not provided', async () => {
      const body = { filePath: '' };

      const result = await controller.test(body);

      expect(result).toEqual({
        success: false,
        message: '请提供filePath字段'
      });
    });

    it('should process file successfully when valid filePath is provided', async () => {
      const body = { filePath: '/path/to/test.md' };
      const mockContent = '# Test Content\n\nThis is a test file.';
      const mockChunks = ['# Test Content', 'This is a test file.'];

      // Mock fs.existsSync to return true
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock fs.readFileSync to return mock content
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      // Mock splitMarkdown to return mock chunks
      mockIngestService.splitMarkdown.mockResolvedValue(mockChunks);

      await controller.test(body);

      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/test.md');
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/test.md', 'utf-8');
      expect(mockIngestService.splitMarkdown).toHaveBeenCalledWith(mockContent);
    });

    it('should throw HttpException when file does not exist', async () => {
      const body = { filePath: '/path/to/nonexistent.md' };

      // Mock fs.existsSync to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      try {
        await controller.test(body);
      } catch (error) {
        expect(error.message).toBe('文件不存在: /path/to/nonexistent.md');
      }
    });

    it('should throw HttpException for non-md files', async () => {
      const body = { filePath: '/path/to/test.txt' };

      // Mock fs.existsSync to return true
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      try {
        await controller.test(body);
      } catch (error) {
        expect(error.message).toBe('只支持 Markdown 文件 (.md)');
      }
    });
  });
});