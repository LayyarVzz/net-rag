// ingest.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestService } from './ingest.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndIngest(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new HttpException('未提供文件', HttpStatus.BAD_REQUEST);
    }

    if (file.mimetype !== 'text/markdown' && !file.originalname.endsWith('.md')) {
      throw new HttpException('只支持 Markdown 文件 (.md)', HttpStatus.BAD_REQUEST);
    }

    try {
      // 使用操作系统临时目录，避免路径问题
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
      fs.writeFileSync(tempPath, file.buffer);
      
      // 处理文件
      await this.ingestService.ingest(tempPath);
      
      // 删除临时文件
      fs.unlinkSync(tempPath);
      
      return {
        message: '文件处理成功',
        filename: file.originalname,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '文件处理失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}