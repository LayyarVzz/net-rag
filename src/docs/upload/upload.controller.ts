import { Controller, Post, HttpCode, Delete, Param, Get } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

function createMulterOptions(
  dest: string,
  limit: number,
  allowedMimeTypes: string[]
): MulterOptions {
  return {
    storage: diskStorage({
      destination: dest,
      filename: (_, file, cb) => {
        cb(null, file.originalname);
      }
    }),
    limits: {
      fileSize: limit
    },
    fileFilter: (_, file, cb) => {
      if (allowedMimeTypes.length === 0) {
        cb(new Error('未指定允许的文件类型'), false);
      }else if(allowedMimeTypes.includes('text/markdown')){
        // 允许 .md 和 .markdown 扩展名的文件，即使 MIME 类型是 application/octet-stream
          const fileName = file.originalname.toLowerCase();
          if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
          cb(null, true);
          return;
          }
      } else if (!allowedMimeTypes.includes(file.mimetype)) {
        cb(new Error('文件类型不支持'), false);
      } else {
        cb(null, true);
      }
    }
  };
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('pdf')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', createMulterOptions('./uploads/pdf', 20 * 1024 * 1024, ['application/pdf'])))
  uploadPDF(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.echoFile(file);
  }

  @Post('docx')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', createMulterOptions('./uploads/docx', 20 * 1024 * 1024, ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])))
  uploadDOCX(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.echoFile(file);
  }

  @Post('md')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', createMulterOptions('./uploads/md', 20 * 1024 * 1024, ['text/markdown'])))
  uploadMD(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.echoFile(file);
  }

  @Delete('del/:filetype/:filename')
  @HttpCode(200)
  deleteFile(@Param('filetype') filetype: string, @Param('filename') filename: string) {
    return this.uploadService.dleFile(filetype, filename);
  }
}
