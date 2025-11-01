import { Controller, Post, HttpCode } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
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
        const tempName = `${Date.now() + path.extname(file.originalname)}`;
        cb(null, tempName);
      }
    }),
    limits: {
      fileSize: limit
    },
    fileFilter: (_, file, cb) => {
      if (allowedMimeTypes.length === 0) {
        cb(new Error('未指定允许的文件类型'), false);
      }

      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('文件类型不支持'), false);
      }
    }
  };
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('test')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions(
        './uploads/test',
        20 * 1024 * 1024,
        ['image/jpeg', 'image/png']
      )
    )
  )
  uploadTestFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.echoFile(file);
  }

  @Post('pdf')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions(
        './uploads/pdf',
        20 * 1024 * 1024,
        ['application/pdf']
      )
    )
  )
  uploadPDF(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.echoFile(file);
  }

  @Post('docx')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions(
        './uploads/docx',
        20 * 1024 * 1024,
        ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      )
    )
  )
  uploadDOCX(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.echoFile(file);
  }
}
