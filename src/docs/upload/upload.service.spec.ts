import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('echoFile', () => {
    it('should return file upload success message', () => {
      const mockFile = {
        originalname: 'test.pdf',
        filename: '123456.pdf',
      } as Express.Multer.File;

      const result = service.echoFile(mockFile);

      expect(result).toEqual({
        message: '文件上传成功',
        originalname: 'test.pdf',
        filename: '123456.pdf',
      });
    });

    it('should handle different file types', () => {
      const mockFile = {
        originalname: 'image.jpg',
        filename: '789012.jpg',
      } as Express.Multer.File;

      const result = service.echoFile(mockFile);

      expect(result).toEqual({
        message: '文件上传成功',
        originalname: 'image.jpg',
        filename: '789012.jpg',
      });
    });
  });
});