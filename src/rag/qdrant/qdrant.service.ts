import { Injectable, OnModuleInit, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { DocumentInterface } from '@langchain/core/documents';
import { EmbeddingService } from '../embedding/embedding.service';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class QdrantService implements OnModuleInit {
  private vectorStore: QdrantVectorStore; //存储向量的实例
  private readonly logger = new Logger(QdrantService.name); //日志记录

  // 构造函数，接收嵌入模型
  constructor(private readonly embeddingService: EmbeddingService) { }

  // nestjs生命周期函数,模块初始化时调用
  async onModuleInit() {
    try {
      const embeddings = this.embeddingService.getEmbeddings();
      if (!embeddings) {
        this.logger.warn('嵌入模型未初始化，请先配置嵌入模型');
        throw new HttpException(
          '嵌入模型未初始化，请先配置嵌入模型',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        await this.updateQdrantEmbeddingModel(embeddings);
        this.logger.log(`Qdrant向量数据库初始化成功，使用模型：${embeddings.model}，集合名称：${process.env.QDRANT_COLLECTION_NAME}`);
      }
    } catch (error) {
      //记录错误日志
      this.logger.error('Qdrant向量数据库初始化失败', error.message);
    }
  }

  /**
   * 获取当前向量存储实例
   * @returns QdrantVectorStore 向量存储实例
   */
  getVectorStore(): QdrantVectorStore {
    return this.vectorStore;
  }

  /**
   * 更新向量存储中的嵌入模型
   * @param newEmbeddingService 新的嵌入服务实例
   */
  async updateQdrantEmbeddingModel(newEmbedding: OpenAIEmbeddings): Promise<void> {
    // 重新创建QdrantVectorStore实例
    this.vectorStore = await QdrantVectorStore.fromExistingCollection(
      newEmbedding,
      {
        url: process.env.QDRANT_URL,
        collectionName: process.env.QDRANT_COLLECTION_NAME,
      },
    );
  }

  /**
  * 添加文档到 Qdrant 向量数据库（自动兼容 text-embedding-v4 的 batch≤10 限制）
  * @param documents Document 类型数组
  */
  async addDocuments(documents: Document[]): Promise<void> {
    const BATCH_SIZE = 10; // 阿里云 text-embedding-v4 单次上限
    try {
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        this.logger.log(`添加文档批次 ${i / BATCH_SIZE + 1} 到 Qdrant`);
        await this.vectorStore.addDocuments(batch);
      }
      this.logger.log('文档添加到 Qdrant 成功');
    } catch (error) {
      this.logger.error('添加文档到 Qdrant 失败', error.message);
      throw new HttpException(
        '添加文档到 Qdrant 失败，请稍后再试',
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
  async similaritySearch(query: string, k: number = 4): Promise<DocumentInterface[]> {
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
  async similaritySearchWithRerank(query: string, k: number): Promise<DocumentInterface[]> {
    try {
      // 进行相似性搜索
      const res = await this.vectorStore.similaritySearch(query, k);
      this.logger.log('similaritySearch成功，准备调用Rerank API');
      // console.log(res);
      // 提取文档
      const documents = res.map(doc => doc.pageContent);
      // console.log('文档:', documents)
      this.logger.log(`API Key:${process.env.DASHSCOPE_API_KEY ? '已设置' : '未设置'}`);
      // 使用阿里云的rerank API进行排序
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank', {
        method: 'POST',
        headers: {
          // 阿里云的 API 密钥
          'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          // 指定内容为JSON
          'Content-Type': 'application/json',
        },
        // 将请求转换成json字符串
        body: JSON.stringify({
          // 模型名称
          model: 'qwen3-rerank',
          //  输入的参数
          input: {
            query: query,
            documents: documents
          },
          // 指定模型输出参数为rank结果
          parameters: {
            output_type: 'rank'
          }
        })
      });
      this.logger.log(`Rerank API 响应状态:${response.status}`);
      //如果不是成功状态则抛出错误
      if (!response.ok) {
        // 获取错误详情
        const errorText = await response.text();
        // 记录详细的错误日志
        this.logger.error(`Rerank API调用失败: ${response.status} - ${errorText}`);
        throw new Error(`Rerank API调用失败: ${response.status}`);
      }

      // 解析API响应数据
      const responseData = await response.json();

      // 根据rerank结果重新排序文档
      // 从响应中提取排序结果
      const rankedResults = responseData.output.results;
      // 根据返回的索引顺序重新排列原始文档
      const rerankedDocs = rankedResults.map(result => res[result.index]);

      // 返回经过rerank重排序的文档列表
      // console.log('rerank结果:', rerankedDocs)
      return rerankedDocs;

    } catch (error) {
      this.logger.error('相似性搜索与重排序失败', error.message);
      // 抛出 HTTP 异常，返回内部服务器错误给客户端
      throw new HttpException(
        '搜索失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * 相似性搜索并返回分数
   * @param query 查询字符串
   * @param k 返回结果数量，默认为 4
   * @returns 包含文档和对应分数的数组
   */
  async similaritySearchWithScore(query: string, k: number = 4): Promise<[DocumentInterface, number][]> {
    try {
      // 进行相似性搜索并获取分数
      const res = await this.vectorStore.similaritySearchWithScore(query, k);
      this.logger.log('带分数的相似性搜索成功');
      // 返回结果
      return res;
    } catch (error) {
      this.logger.error('带分数的相似性搜索失败', error);
      throw new HttpException(
        '搜索失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 重置向量数据库里的知识库
   * @returns Promise<void>
   */
  async resetVectorStore(): Promise<void> {
    try {
      // 获取 Qdrant 客户端实例
      const client = this.vectorStore.client;
      const collectionName = process.env.QDRANT_COLLECTION_NAME;
      // console.log('collectionName:', collectionName)
      if (!collectionName) {
        this.logger.error('QDRANT_COLLECTION_NAME 环境变量未定义');
        throw new HttpException(
          '环境配置错误，缺少集合名称',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      // 删除集合中的所有点（文档）
      await client.delete(collectionName, {
        filter: {} // 空过滤器表示匹配所有点
      });

      this.logger.log('Qdrant向量数据库知识库重置成功');
    } catch (error) {
      this.logger.error('Qdrant向量数据库重置失败', error.message);
      throw new HttpException(
        '重置向量数据库失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}



