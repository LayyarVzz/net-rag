import { Controller, Get, Query, Logger } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) { }

  @Get('query')
  async getEmbedQuery(@Query('text') query?: string) {
    // 如果没有提供查询参数，则使用默认文本
    const queryText = query || '今天天气真不错~你想去哪里玩？';
    this.logger.log(`正在处理查询: ${queryText}`);

    const result = await this.ragService.getEmbedQuery(queryText);

    return {
      query: queryText,
      embedding: result,
      dimension: result.length,
      isAllZeros: result.every(v => v === 0)
    };
  }
}
