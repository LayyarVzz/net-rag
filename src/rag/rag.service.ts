import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding/embedding.service';
import { QdrantService } from './qdrant/qdrant.service';
import { LlmService } from './llm/llm.service';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class RagService {
  private readonly logger: Logger;
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly qdrant: QdrantService,
    private readonly llm: LlmService,
  ) {
    this.logger = new Logger(RagService.name);
  }

  /**
   * 对查询进行嵌入
   * @param query 查询字符串
   * @returns 嵌入向量
   */
  getEmbedQuery(query: string): Promise<number[]> {
    return this.embedding.embedQuery(query);
  }

  /**
   * 重置向量存储
   */
  async resetVectorStore() {
    await this.qdrant.resetVectorStore();
  }

  /**
   * 基于查询检索文档
   * @param query 查询字符串
   * @param topK 检索文档数量
   * @returns 文档内容数组
   */
  private async retrieve(query: string, topK: number = 5): Promise<string[]> {
    const chunks = await this.qdrant.similaritySearch(query, topK);
    return chunks.map(chunk => chunk.pageContent);
  }

  /**
   * 基于查询检索文档并返回分数
   * @param query 查询字符串
   * @param topK 检索文档数量
   * @returns 文档内容数组
   */
  private async retrieveWithScore(query: string, topK: number = 5): Promise<string[]> {
    const chunks = await this.qdrant.similaritySearchWithScore(query, topK);
    return chunks.map(chunk => chunk[0].pageContent);
  }

  /**
   * 基于查询检索文档并使用Rerank排序
   * @param query 查询字符串
   * @param topK 检索文档数量
   * @returns 文档内容数组
   */
  private async retrieveWithRerank(query: string, topK: number = 10): Promise<string[]> {
    const chunks = await this.qdrant.similaritySearchWithRerank(query, topK);
    return chunks.map(chunk => chunk.pageContent);
  }

  /**
   * 基于查询检索文档并使用Rerank排序后，调用LLM生成响应
   * @param userQuestion 查询字符串
   * @param topK 检索文档数量
   * @returns LLM生成的响应字符串
   */
  async ragChat(userQuestion: string, topK: number = 10): Promise<string> {
    try {
      // this.logger.log(`userQuestion:${userQuestion}`);
      const chunks = await this.retrieveWithRerank(userQuestion, topK);
      // console.log('重排序的块为', chunks);
      return await this.llm.ragChat(userQuestion, chunks);
    } catch (error) {
      this.logger.error('Error in ragChat method', error);
      throw new Error(`Failed to generate RAG response: ${error.message}`);
    }
  }

  /**
   * 调用LLM生成响应
   * @param userQuestion 查询字符串
   * @returns LLM生成的响应字符串
   */
  async chat(userQuestion: string): Promise<string> {
    try {
      // this.logger.log(`userQuestion:${userQuestion}`);
      return await this.llm.chat(userQuestion);
    } catch (error) {
      this.logger.error('Error in chat method', error);
      throw new Error(`Failed to generate chat response: ${error.message}`);
    }
  }

  /**
   * 更新LLM模型
   * @param model 模型名称
   * @param baseURL API基础URL
   * @param apiKey API密钥
   */
  updateLLMModel(model: string, baseURL: string, apiKey: string) {
    const newChatModel = this.llm.updateLLMModel(model, baseURL, apiKey);
    this.logger.log(`llm 更新成功，model: ${newChatModel.model} , baseURL: ${newChatModel.clientConfig.baseURL}`);
  }

  /**
   * 更新Embedding模型
   * @param model 模型名称
   * @param baseURL API基础URL
   * @param apiKey API密钥
   */
  async updateEmbeddingModel(model: string, baseURL: string, apiKey: string): Promise<void> {
    try {
      // 检查新模型的维度是否与现有Collection兼容
      const client = this.qdrant.getVectorStore()?.client;
      const collectionName = process.env.QDRANT_COLLECTION_NAME;
      if (client && collectionName) {
        // 获取当前Collection的信息
        const collectionInfo = await client.getCollection(collectionName);
        if (!collectionInfo.config.params.vectors) {
          this.logger.warn('Collection 配置中未定义向量参数');
          return;
        }
        const currentDimension = collectionInfo.config.params.vectors.size;

        // 测试新模型的维度
        const newEmbedding = this.embedding.createEmbedding(model, baseURL, apiKey);
        const testEmbedding = await newEmbedding.embedQuery("test");
        const newDimension = testEmbedding.length;

        if (currentDimension !== newDimension) {
          this.logger.error(`向量维度不匹配: 当前维度=${currentDimension}, 新模型维度=${newDimension}`);
          throw new Error();
        }
        this.embedding.updateEmbeddingModel(newEmbedding);
        await this.qdrant.updateQdrantEmbeddingModel(this.embedding.getEmbeddings());
        this.logger.log(`embedding 模型更新成功: ${newEmbedding.model}`);
      }
    } catch (error) {
      this.logger.error('embedding 模型更新失败');
    }
  }
}
