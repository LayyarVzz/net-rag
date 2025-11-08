import { Test, TestingModule } from '@nestjs/testing';
import { IngestService } from './ingest.service';
import { QdrantService } from '../../rag/qdrant/qdrant.service';
import { Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import * as fs from 'fs';

// 创建 QdrantService 的 mock 实现
const mockQdrantService = {
  addDocuments: jest.fn(),
};

// 为 fs 模块创建 mock 对象
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
};

describe('IngestService', () => {
  let service: IngestService;
  let qdrantService: QdrantService;

  beforeEach(async () => {
    // 在每次测试前重置 mock 函数
    mockFs.existsSync.mockReset();
    mockFs.readFileSync.mockReset();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: QdrantService,
          useValue: mockQdrantService,
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
    qdrantService = module.get<QdrantService>(QdrantService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('splitMarkdown', () => {
    it('should split markdown content into chunks', async () => {
      const content = `
# Title 1
This is content of section 1.

## Title 2
This is content of section 2 with more text to exceed the chunk size limit if needed.
`;

      const chunks = await service.splitMarkdown(content, 100);
      expect(chunks).toBeDefined();
      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should handle empty content', async () => {
      const content = '';
      const chunks = await service.splitMarkdown(content);
      expect(chunks).toEqual([]);
    });
  });

  describe('ingestMarkdownDocuments', () => {
    it('should process and ingest markdown documents', async () => {
      const chunks = ['This is chunk 1', 'This is chunk 2'];
      const source = 'test.md';
      
      mockQdrantService.addDocuments.mockResolvedValue(undefined);

      await service.ingestMarkdownDocuments(chunks, source);

      expect(qdrantService.addDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            pageContent: 'This is chunk 1',
            metadata: expect.objectContaining({
              source: 'test.md',
              chunkIndex: 0,
            }),
          }),
          expect.objectContaining({
            pageContent: 'This is chunk 2',
            metadata: expect.objectContaining({
              source: 'test.md',
              chunkIndex: 1,
            }),
          }),
        ]),
      );
    });

    it('should throw HttpException when ingestion fails', async () => {
      const chunks = ['This is chunk 1'];
      const source = 'test.md';
      
      mockQdrantService.addDocuments.mockRejectedValue(new Error('Database error'));

      await expect(service.ingestMarkdownDocuments(chunks, source))
        .rejects
        .toThrow('处理文档块失败，请稍后再试');
    });
  });

  describe('ingest', () => {
    const testFilePath = './test.md';
    const fileContent = '# Test Title\n\nThis is test content.';

    it('should process a markdown file successfully', async () => {
      // 设置 mock 返回值
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent as any);
      
      // Spy on service methods
      const splitMarkdownSpy = jest.spyOn(service, 'splitMarkdown').mockResolvedValue(['This is a chunk']);
      const ingestMarkdownDocumentsSpy = jest.spyOn(service, 'ingestMarkdownDocuments').mockResolvedValue();

      // 替换模块中的 fs 引用
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(mockFs.existsSync);
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(mockFs.readFileSync);

      await service.ingest(testFilePath);

      expect(mockFs.existsSync).toHaveBeenCalledWith(testFilePath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(testFilePath, 'utf-8');
      expect(splitMarkdownSpy).toHaveBeenCalledWith(fileContent);
      expect(ingestMarkdownDocumentsSpy).toHaveBeenCalled();
    });

    it('should throw HttpException if file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(mockFs.existsSync);

      await expect(service.ingest(testFilePath))
        .rejects
        .toThrow('文件不存在: ./test.md');
    });

    it('should throw HttpException for non-md files', async () => {
      const nonMdFilePath = './test.txt';
      mockFs.existsSync.mockReturnValue(true);
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(mockFs.existsSync);
      
      // Mock path.extname to return .txt
      const path = require('path');
      const extnameSpy = jest.spyOn(path, 'extname').mockReturnValue('.txt');

      await expect(service.ingest(nonMdFilePath))
        .rejects
        .toThrow('只支持 Markdown 文件 (.md)');
      
      extnameSpy.mockRestore();
    });

    it('should throw HttpException when file processing fails', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read file error');
      });
      
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(mockFs.existsSync);
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(mockFs.readFileSync);

      await expect(service.ingest(testFilePath))
        .rejects
        .toThrow('文件处理失败，请稍后再试');
    });
  });
});