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

  getEmbedQuery(query: string) {
    return this.embedding.embedQuery(query);
  }

  private async retrieve(query: string) {
    const chunks = await this.qdrant.similaritySearch(query, 5);
    return chunks.map(chunk => chunk.pageContent);
  }

  private async retrieveWithRerank(query: string) {
    const chunks = await this.qdrant.similaritySearchWithRerank(query, 5);
    return chunks.map(chunk => chunk.pageContent);
  }

  private async retrieveWithScore(query: string) {
    const chunks = await this.qdrant.similaritySearchWithRerank(query, 5);
    return chunks.map(chunk => chunk.pageContent);
  }

  async ragChat(userQuestion: string): Promise<string> {
    try {
      const chunks = await this.retrieveWithScore(userQuestion);
      return await this.llm.ragChat(userQuestion, chunks);
    } catch (error) {
      this.logger.error('Error in ragChat method', error);
      throw new Error(`Failed to generate RAG response: ${error.message}`);
    }
  }
}
