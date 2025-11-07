import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Mock fs functions
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock path.join to return predictable paths
jest.mock('path', () => ({
  join: (...paths: string[]) => paths.join('/').replace(/\.\//g, ''),
}));

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('echoFile', () => {
    it('should return file upload success message with all properties', () => {
      const mockFile = {
        originalname: 'test.pdf',
        filename: 'test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const result = service.echoFile(mockFile);

      expect(result).toEqual({
        message: '文件上传成功',
        originalname: 'test.pdf',
        filename: 'test.pdf',
        mimetype: 'application/pdf',
      });
    });

    it('should handle different file types', () => {
      const mockFile = {
        originalname: 'image.jpg',
        filename: 'image.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = service.echoFile(mockFile);

      expect(result).toEqual({
        message: '文件上传成功',
        originalname: 'image.jpg',
        filename: 'image.jpg',
        mimetype: 'image/jpeg',
      });
    });
  });

  describe('dleFile', () => {
    it('should delete file successfully when file exists', () => {
      // Mock existsSync to return true
      (existsSync as jest.Mock).mockReturnValue(true);

      const result = service.dleFile('pdf', 'test.pdf');

      expect(existsSync).toHaveBeenCalledWith('uploads/pdf/test.pdf');
      expect(unlinkSync).toHaveBeenCalledWith('uploads/pdf/test.pdf');
      expect(result).toEqual({
        message: '文件删除成功',
        filename: 'test.pdf',
        filePath: 'uploads/pdf/test.pdf',
        filetype: 'pdf',
      });
    });

    it('should return message when trying to delete non-existent file', () => {
      // Mock existsSync to return false
      (existsSync as jest.Mock).mockReturnValue(false);

      const result = service.dleFile('pdf', 'nonexistent.pdf');

      expect(existsSync).toHaveBeenCalledWith('uploads/pdf/nonexistent.pdf');
      expect(unlinkSync).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: '尝试删除不存在的文件',
        filename: 'nonexistent.pdf',
        filePath: 'uploads/pdf/nonexistent.pdf',
        filetype: 'pdf',
      });
    });

    it('should throw error when file deletion fails', () => {
      // Mock existsSync to return true
      (existsSync as jest.Mock).mockReturnValue(true);
      // Mock unlinkSync to throw an error
      (unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Deletion failed');
      });

      expect(() => service.dleFile('pdf', 'test.pdf')).toThrow('文件删除失败');
      expect(existsSync).toHaveBeenCalledWith('uploads/pdf/test.pdf');
      expect(unlinkSync).toHaveBeenCalledWith('uploads/pdf/test.pdf');
    });
  });
});