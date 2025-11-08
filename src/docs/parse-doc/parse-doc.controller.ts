import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ParseDocService } from './parse-doc.service';

@Controller('parse-doc')
export class ParseDocController {
  constructor(private readonly parseDocService: ParseDocService) {}

  /**
   * GET请求测试 - 通过查询参数指定文件路径
   */
  @Get('parse')
  async parseDocument(@Query('filePath') filePath: string) {
    if (!filePath) {
      return {
        success: false,
        message: '请提供filePath查询参数，例如：/parse-doc/parse?filePath=./test.pdf'
      };
    }

    try {
      await this.parseDocService.parseDocument(filePath);
      return {
        success: true,
        message: '文档解析完成'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * POST请求测试 - 通过请求体指定文件路径
   */
  @Post('parse')
  async parseDocumentPost(@Body() body: { filePath: string }) {
    const { filePath } = body;
    
    if (!filePath) {
      return {
        success: false,
        message: '请提供filePath字段'
      };
    }

    try {
      await this.parseDocService.parseDocument(filePath);
      return {
        success: true,
        message: '文档解析完成'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 健康检查接口
   */
  @Get('health')
  healthCheck() {
    return {
      service: 'parse-doc',
      status: 'running',
      timestamp: new Date().toISOString()
    };
  }
}