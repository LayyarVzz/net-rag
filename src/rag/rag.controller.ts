import { Controller, Get, Query, Logger, Post, Body, HttpCode } from '@nestjs/common';
import { RagService } from './rag.service';

interface RagResponse {
  code: number;
  message: string;
  query: string;
  response: string;
}

@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) { }

  @Get('queryTest')
  async getEmbedQuery(@Query('text') query?: string) {
    // 如果没有提供查询参数，则使用默认文本
    const queryText = query || '今天天气真不错~你想去哪里玩？';
    let result: number[];
    let code: number;
    let msg: string;
    let embedding: number[];
    this.logger.log(`正在处理查询: ${queryText}`);
    try {
      result = await this.ragService.getEmbedQuery(queryText);
      msg = '查询成功';
      code = 200;
      embedding = result;
    } catch (error) {
      this.logger.error('获取嵌入向量失败', error);
      msg = '获取嵌入向量失败';
      code = 500;
      embedding = [];
    }

    return {
      code: code,
      message: msg,
      query: queryText,
      embedding: embedding,
    };
  }

  @Get('resetVectorStore')
  @HttpCode(200)
  async resetVectorStore() {
    let msg: string;
    let code: number;
    try {
      await this.ragService.resetVectorStore();
      msg = '向量存储重置成功';
      code = 200;
    } catch (error) {
      this.logger.error('重置向量存储失败', error);
      msg = '向量存储重置失败';
      code = 500;
    }
    return {
      code: code,
      message: msg,
    };
  }

  @Post('retrieve')
  @HttpCode(200)
  async ragChat(@Body() body: { text: string }): Promise<RagResponse> {
    // 如果没有提供查询参数，则使用默认文本
    if (!body.text) {
      this.logger.warn('用户未填写查询文本');
      return {
        code: 400,
        message: '查询文本不能为空',
        query: '',
        response: '',
      };
    }
    const queryText = body.text;
    let result: string;
    try {
      this.logger.log(`正在处理查询: ${queryText}`);
      result = await this.ragService.ragChat(queryText, 7);
      this.logger.log(`ragChat 方法成功`);
    } catch (error) {
      this.logger.error('ragChat 方法失败', error);
      result = `ragChat 方法失败: ${error.message}`;
    }

    return {
      code: 200,
      message: 'rag成功',
      query: queryText,
      response: result,
    };
  }

  @Post('settings/llm')
  @HttpCode(200)
  async setSettings(@Body() body: {
    baseURL: string,
    apiKey: string,
    model: string
  }) {
    let msg: string;
    let code: number;
    // 检查是否提供了所有必要的参数
    if (!body.baseURL || !body.apiKey || !body.model) {
      msg = '所有参数都是必填的';
      code = 400;
      this.logger.warn('用户未填写llm相关参数');
    }
    else {
      msg = '设置成功';
      code = 200;
      this.logger.log(`llm设置成功: ${JSON.stringify(body)}`);
    }

    process.env.BASE_URL = body.baseURL;
    process.env.API_KEY = body.apiKey;
    process.env.LLM_MODEL = body.model;

    return {
      code: code,
      message: msg,
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
    let msg: string;
    let code: number;
    // 检查是否提供了所有必要的参数
    if (!body.baseURL || !body.apiKey || !body.model) {
      msg = '所有参数都是必填的';
      code = 400;
      this.logger.warn('用户未填写embedding相关参数');
    }
    else {
      msg = '设置成功';
      code = 200;
      this.logger.log(`embedding设置成功: ${JSON.stringify(body)}`);
    }

    process.env.EMBEDDING_BASE_URL = body.baseURL;
    process.env.EMBEDDING_API_KEY = body.apiKey;
    process.env.EMBEDDING_MODEL = body.model;

    return {
      code: code,
      message: msg,
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
    let msg: string;
    let code: number;
    // 检查是否提供了所有必要的参数
    if (!body.apiKey) {
      msg = '所有参数都是必填的';
      code = 400;
      this.logger.warn('用户未填写reranker相关参数');
    }
    else {
      msg = '设置成功';
      code = 200;
      this.logger.log(`reranker设置成功: ${JSON.stringify(body)}`);
    }

    process.env.DASHSCOPE_API_KEY = body.apiKey;

    return {
      code: code,
      message: msg,
      apiKey: body.apiKey
    };
  }
}
