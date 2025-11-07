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
            echoFile: jest.fn(),
            dleFile: jest.fn().mockReturnValue({
              message: '文件删除成功',
              filename: 'test.pdf',
              filePath: './uploads/pdf/test.pdf',
              filetype: 'pdf',
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

  describe('uploadPDF', () => {
    it('should upload a PDF file', () => {
      const mockFile = {
        originalname: 'document.pdf',
        filename: 'document.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const mockReturnValue = {
        message: '文件上传成功',
        originalname: 'document.pdf',
        filename: 'document.pdf',
        mimetype: 'application/pdf',
      };

      (service.echoFile as jest.Mock).mockReturnValueOnce(mockReturnValue);

      const result = controller.uploadPDF(mockFile);

      expect(service.echoFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockReturnValue);
    });
  });

  describe('uploadDOCX', () => {
    it('should upload a DOCX file', () => {
      const mockFile = {
        originalname: 'document.docx',
        filename: 'document.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      } as Express.Multer.File;

      const mockReturnValue = {
        message: '文件上传成功',
        originalname: 'document.docx',
        filename: 'document.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      (service.echoFile as jest.Mock).mockReturnValueOnce(mockReturnValue);

      const result = controller.uploadDOCX(mockFile);

      expect(service.echoFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockReturnValue);
    });
  });

  describe('uploadMD', () => {
    it('should upload a MD file', () => {
      const mockFile = {
        originalname: 'document.md',
        filename: 'document.md',
        mimetype: 'text/markdown',
      } as Express.Multer.File;

      const mockReturnValue = {
        message: '文件上传成功',
        originalname: 'document.md',
        filename: 'document.md',
        mimetype: 'text/markdown',
      };

      (service.echoFile as jest.Mock).mockReturnValueOnce(mockReturnValue);

      const result = controller.uploadMD(mockFile);

      expect(service.echoFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockReturnValue);
    });
  });

  describe('deleteFile', () => {
    it('should delete a test file', () => {
      const result = controller.deleteFile('pdf', 'test.pdf');

      expect(service.dleFile).toHaveBeenCalledWith('pdf', 'test.pdf');
      expect(result).toEqual({
        message: '文件删除成功',
        filename: 'test.pdf',
        filePath: './uploads/pdf/test.pdf',
        filetype: 'pdf',
      });
    });
  });
});