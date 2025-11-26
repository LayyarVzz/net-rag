import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding/embedding.service';
import { QdrantService } from './qdrant/qdrant.service';
import { LlmService } from './llm/llm.service';

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

  getEmbedQuery(query: string): Promise<number[]> {
    return this.embedding.embedQuery(query);
  }

  async resetVectorStore() {
    await this.qdrant.resetVectorStore();
  }

  private async retrieve(query: string, topK: number = 5): Promise<string[]> {
    const chunks = await this.qdrant.similaritySearch(query, topK);
    return chunks.map(chunk => chunk.pageContent);
  }

  private async retrieveWithScore(query: string, topK: number = 5): Promise<string[]> {
    const chunks = await this.qdrant.similaritySearchWithScore(query, topK);
    return chunks.map(chunk => chunk[0].pageContent);
  }

  private async retrieveWithRerank(query: string, topK: number = 10): Promise<string[]> {
    const chunks = await this.qdrant.similaritySearchWithRerank(query, topK);
    return chunks.map(chunk => chunk.pageContent);
  }

  async ragChat(userQuestion: string, topK: number = 10): Promise<string> {
    try {
      console.log('userQuestion:', userQuestion);
      const chunks = await this.retrieveWithRerank(userQuestion, topK);
      console.log('重排序的块为', chunks);
      return await this.llm.ragChat(userQuestion, chunks);
    } catch (error) {
      this.logger.error('Error in ragChat method', error);
      throw new Error(`Failed to generate RAG response: ${error.message}`);
    }
  }
}
