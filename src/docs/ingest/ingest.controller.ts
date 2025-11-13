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