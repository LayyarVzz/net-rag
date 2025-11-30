import { Controller, Get, Query, Logger, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) { }

  /**
   * 获取查询文本的嵌入向量，测试
   * @param query 查询字符串
   * @returns 嵌入向量对象
   */
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

  /**
   * 重置向量存储，测试
   * @returns 重置成功消息
   */
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

  /**
   * 基于查询检索文档并使用Rerank排序后，调用LLM生成响应
   * @param body 请求体，包含查询文本
   * @returns 包含查询文本和LLM生成响应的对象
   */
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
      const result = await this.ragService.ragChat(queryText, 10);
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

  /**
   * 调用LLM生成响应
   * @param body 请求体，包含查询文本
   * @returns 包含查询文本和LLM生成响应的对象
   */
  @Post('chat')
  @HttpCode(200)
  async chat(@Body() body: { text: string }) {
    // 如果没有提供查询参数，则使用默认文本
    if (!body.text) {
      this.logger.warn('用户未填写查询文本');
      // 可以使用NestJS内置的HttpException来设置状态码和错误信息
      throw new BadRequestException('查询文本不能为空');
    }
    try {
      this.logger.log(`正在处理文本: ${body.text}`);
      const result = await this.ragService.chat(body.text);
      this.logger.log(`chat 方法成功`);
      return {
        query: body.text,
        response: result,
      };
    } catch (error) {
      this.logger.error('chat 方法失败', error);
      throw new BadRequestException({
        message: 'chat 方法失败',
        error: error.message
      });
    }
  }

  /**
   * 更新LLM模型
   * @param body 请求体，包含模型参数
   * @returns 包含设置成功消息和参数的对象
   */
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

    this.logger.log(`设置llm相关参数:baseURL=${body.baseURL}', model='${body.model}`);
    try {
      this.ragService.updateLLMModel(body.model, body.baseURL, body.apiKey);
    } catch (error) {
      this.logger.error('初始化模型失败', error);
      throw new BadRequestException({
        message: '初始化模型失败',
        error: error.message
      });
    }

    return {
      message: '设置成功',
      baseURL: body.baseURL,
      model: body.model,
    };
  }

  /**
   * 更新Embedding模型
   * @param body 请求体，包含模型参数
   * @returns 包含设置成功消息和参数的对象
   */
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

    this.logger.log(`设置Embedding相关参数:baseURL=${body.baseURL}', model='${body.model}`);
    try {
      await this.ragService.updateEmbeddingModel(body.model, body.baseURL, body.apiKey);
    } catch (error) {
      this.logger.error('更新embedding模型失败', error);
      throw new BadRequestException({
        message: '更新embedding模型失败',
        error: error.message
      });
    }

    return {
      message: '设置成功',
      baseURL: body.baseURL,
      model: body.model,
    };
  }

  /**
   * 更新Reranker模型的API Key
   * @param body 请求体，包含模型参数
   * @returns 包含设置成功消息的对象
   */
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
    this.logger.log(`设置reranker的DASHSCOPE_API_KEY为:${process.env.DASHSCOPE_API_KEY}`);

    return {
      message: '设置成功',
    };
  }
}