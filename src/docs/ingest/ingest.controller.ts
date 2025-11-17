// ingest.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors, HttpException, HttpStatus, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestService } from './ingest.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) { }


  @Post('test')
  async test(@Body() body: { filePath: string }) {
    try {
      if (!body.filePath) {
        return {
          success: false,
          message: '请提供filePath字段'
        };
      }
      console.log('filePath:', body.filePath);

      // 检查文件是否存在
      if (!fs.existsSync(body.filePath)) {
        throw new HttpException(
          `文件不存在: ${body.filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }
      // 检查是否为 md 文件
      if (path.extname(body.filePath) !== '.md') {
        throw new HttpException(
          '只支持 Markdown 文件 (.md)',
          HttpStatus.BAD_REQUEST,
        );
      }
      // 读取文件内容
      const content = fs.readFileSync(body.filePath, 'utf-8');
      // 分割文档
      const chunks = await this.ingestService.splitMarkdown(content);
      console.log('chunks的length:', chunks.length);

      console.log('chunks+索引:\n', chunks.map((chunk, index) => `[${index}] ${chunk}`).join('\n'));

      console.log('chunks的原文:\n', chunks);

    } catch (error) {
      console.log('test error', error);
    }
  }
}