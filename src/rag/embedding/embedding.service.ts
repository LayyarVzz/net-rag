import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingService implements OnModuleInit {
    private embeddings: OpenAIEmbeddings;
    private readonly logger = new Logger(EmbeddingService.name);

    async onModuleInit() {
        this.embeddings = new OpenAIEmbeddings({
            model: process.env.EMBEDDING_MODEL,
            configuration: {
                baseURL: process.env.BASE_URL,
                apiKey: process.env.API_KEY
            },
            encodingFormat: 'float'
        });
        this.logger.log(`初始化嵌入服务，配置信息：MODEL=${process.env.EMBEDDING_MODEL}, BASE_URL=${process.env.BASE_URL}`);
    }

    /**
       * 批量将文本片段转换为向量
       * @param chunks 分块后的文本数组
       * @returns 向量数组（每个元素对应一个文本片段的嵌入向量）
       */
    async embedDocuments(chunks: string[]): Promise<number[][]> {
        try {
            return await this.embeddings.embedDocuments(chunks);
        } catch (error) {
            this.logger.error('文档嵌入处理失败', error.message);
            throw new BadRequestException({
                message: '文档嵌入处理失败，请稍后再试',
                error: error.message
            });
        }
    }

    /**
     * 将单个查询文本转换为向量
     * @param query 用户的查询文本
     * @returns 单个向量（查询文本的嵌入表示）
     */
    async embedQuery(query: string): Promise<number[]> {
        try {
            return await this.embeddings.embedQuery(query);
        } catch (error) {
            this.logger.error('查询嵌入处理失败', error.message);
            throw new BadRequestException({
                message: '查询嵌入处理失败，请稍后再试',
                error: error.message
            });
        }
    }
}
