import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: {
            echoFile: jest.fn().mockReturnValue({
              message: '文件上传成功',
              originalname: 'test.pdf',
              filename: '123456.pdf',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadTestFile', () => {
    it('should upload a test file', () => {
      const mockFile = {
        originalname: 'test.jpg',
        filename: '123456.jpg',
      } as Express.Multer.File;

      const result = controller.uploadTestFile(mockFile);

      expect(service.echoFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual({
        message: '文件上传成功',
        originalname: 'test.pdf',
        filename: '123456.pdf',
      });
    });
  });

  describe('uploadPDF', () => {
    it('should upload a PDF file', () => {
      const mockFile = {
        originalname: 'document.pdf',
        filename: '789012.pdf',
      } as Express.Multer.File;

      const result = controller.uploadPDF(mockFile);

      expect(service.echoFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual({
        message: '文件上传成功',
        originalname: 'test.pdf',
        filename: '123456.pdf',
      });
    });
  });

  describe('uploadDOCX', () => {
    it('should upload a DOCX file', () => {
      const mockFile = {
        originalname: 'document.docx',
        filename: '345678.docx',
      } as Express.Multer.File;

      const result = controller.uploadDOCX(mockFile);

      expect(service.echoFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual({
        message: '文件上传成功',
        originalname: 'test.pdf',
        filename: '123456.pdf',
      });
    });
  });
});