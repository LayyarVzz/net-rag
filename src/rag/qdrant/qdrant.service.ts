import { Injectable, OnModuleInit, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { DocumentInterface } from '@langchain/core/documents';
import { EmbeddingService } from '../embedding/embedding.service';

@Injectable()
export class QdrantService implements OnModuleInit {
  private vectorStore: QdrantVectorStore; //存储向量的实例
  private readonly logger = new Logger(QdrantService.name); //日志记录

  // 构造函数，接收嵌入模型
  constructor(private readonly embeddingService: EmbeddingService) { }
  // nestjs生命周期函数,模块初始化时调用
  async onModuleInit() {
    try {
      this.vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddingService, //调入模型实例
        {
          url: process.env.QDRANT_URL, //环境变量
          collectionName: process.env.QDRANT_COLLECTION_NAME,
        },
      );
      this.logger.log('Qdrant向量数据库初始化成功');
    } catch (error) {
      //记录错误日志
      this.logger.error('Qdrant向量数据库初始化失败', error.message);
      // 抛出http异常
      throw new HttpException(
        'Qdrant向量数据库初始化失败,请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 添加文档到 Qdrant 向量数据库
   * @param documents Document 类型数组
   */
  async addDocuments(documents: Document[]): Promise<void> {
    try {
      //添加文档
      await this.vectorStore.addDocuments(documents);
      this.logger.log('文档添加到Qdrant成功');
    } catch (error) {
      //输出错误信息
      this.logger.error('添加文档到Qdrant失败', error.message);
      throw new HttpException(
        '添加文档到Qdrant失败,请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 相似性搜索
   * @param query 查询字符串
   * @param k 返回结果数量，默认为 4
   * @returns DocumentInterface 数组
   */
  async similaritySearch(query: string, k: number): Promise<DocumentInterface[]> {
    try {
      //进行相似性搜索
      const res = await this.vectorStore.similaritySearch(query, k);
      this.logger.log('相似性搜索成功');
      return res;
    } catch (error) {
      //输出错误信息
      this.logger.error('相似性搜索失败', error.message);
      throw new HttpException(
        '相似性搜索失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
 * 相似性搜索并且使用rerank
 * @param query 查询字符串
 * @param k 返回结果数量，默认为 4
 * @returns 排序后的 DocumentInterface 数组
 */
  async similaritySearchWithRerank(query: string, k: number = 4): Promise<DocumentInterface[]> {
    try {
      // 进行相似性搜索
      const res = await this.vectorStore.similaritySearch(query, k);
      this.logger.log('相似性搜索成功');
      // 使用rerank进行排序
      return res;
    } catch (error) {
      this.logger.error('相似性搜索与重排序失败', error.message);
      // 抛出 HTTP 异常，返回内部服务器错误给客户端
      throw new HttpException(
        '搜索失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}