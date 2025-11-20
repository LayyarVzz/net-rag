import { Controller, Post, Body, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  constructor(private readonly ingestService: IngestService) { }

  /**
   * 通过文件路径处理文档的端点
   * 前端发送文件路径，服务端直接处理该路径的文件
   */
  @Post('test')
  async ingestByPath(@Body() body: { filePath: string }) {
    const { filePath } = body;
    console.log('Received filePath:', filePath);
    if (!filePath) {
      throw new HttpException(
        '文件路径不能为空',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 调用 ingest 服务处理文件
      await this.ingestService.ingest(filePath);

      return {
        statusCode: HttpStatus.OK,
        message: '文件处理并注入成功',
        filePath: filePath,
      };
    } catch (error) {
      this.logger.error('通过路径处理文件失败', error.message);
      throw new HttpException(
        error.message || '文件处理失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}