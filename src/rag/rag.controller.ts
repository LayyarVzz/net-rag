import { Controller, Get, Query, Logger, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) { }

  @Get('queryTest')
  async getEmbedQuery(@Query('text') query?: string) {
    // 如果没有提供查询参数，则使用默认文本
    const queryText = query || '今天天气真不错~你想去哪里玩？';
    this.logger.log(`正在处理查询: ${queryText}`);
    try {
      const result = await this.ragService.getEmbedQuery(queryText);
      return {
        query: queryText,
        embedding: result,
      };
    } catch (error) {
      this.logger.error('获取嵌入向量失败', error);
      throw new BadRequestException({
        message: '获取嵌入向量失败',
        error: error.message
      });
    }
  }

  @Get('resetVectorStore')
  @HttpCode(200)
  async resetVectorStore() {
    try {
      await this.ragService.resetVectorStore();
      return {
        message: '向量存储重置成功'
      };
    } catch (error) {
      this.logger.error('重置向量存储失败', error);
      throw new BadRequestException({
        message: '重置向量存储失败',
        error: error.message
      });
    }
  }

  @Post('retrieve')
  @HttpCode(200)
  async ragChat(@Body() body: { text: string }) {
    // 如果没有提供查询参数，则使用默认文本
    if (!body.text) {
      this.logger.warn('用户未填写查询文本');
      // 可以使用NestJS内置的HttpException来设置状态码和错误信息
      throw new BadRequestException('查询文本不能为空');
    }
    const queryText = body.text;
    try {
      this.logger.log(`正在处理查询: ${queryText}`);
      const result = await this.ragService.ragChat(queryText, 7);
      this.logger.log(`ragChat 方法成功`);
      return {
        query: queryText,
        response: result,
      };
    } catch (error) {
      this.logger.error('ragChat 方法失败', error);
      throw new BadRequestException({
        message: 'ragChat 方法失败',
        error: error.message
      });
    }
  }

  @Post('settings/llm')
  @HttpCode(200)
  async setSettings(@Body() body: {
    baseURL: string,
    apiKey: string,
    model: string
  }) {
    // 检查是否提供了所有必要的参数
    if (!body.baseURL || !body.apiKey || !body.model) {
      this.logger.warn('用户未填写llm相关参数');
      throw new BadRequestException('所有参数都是必填的');
    }

    process.env.BASE_URL = body.baseURL;
    process.env.API_KEY = body.apiKey;
    process.env.LLM_MODEL = body.model;

    return {
      message: '设置成功',
      baseURL: body.baseURL,
      apiKey: body.apiKey,
      model: body.model,
    };
  }

  @Post('settings/embedding')
  @HttpCode(200)
  async setEmbeddingSettings(@Body() body: {
    baseURL: string,
    apiKey: string,
    model: string
  }) {
    // 检查是否提供了所有必要的参数
    if (!body.baseURL || !body.apiKey || !body.model) {
      this.logger.warn('用户未填写embedding相关参数');
      throw new BadRequestException('所有参数都是必填的');
    }

    process.env.EMBEDDING_BASE_URL = body.baseURL;
    process.env.EMBEDDING_API_KEY = body.apiKey;
    process.env.EMBEDDING_MODEL = body.model;

    return {
      message: '设置成功',
      baseURL: body.baseURL,
      apiKey: body.apiKey,
      model: body.model,
    };
  }

  @Post('settings/reranker')
  @HttpCode(200)
  async setRerankerSettings(@Body() body: {
    apiKey: string
  }) {
    // 检查是否提供了所有必要的参数
    if (!body.apiKey) {
      this.logger.warn('用户未填写reranker相关参数');
      throw new BadRequestException('apiKey参数是必填的');
    }

    process.env.DASHSCOPE_API_KEY = body.apiKey;

    return {
      message: '设置成功',
      apiKey: body.apiKey
    };
  }
}