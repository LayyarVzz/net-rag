import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingService implements OnModuleInit {
    private embeddings: OpenAIEmbeddings;
    private readonly logger = new Logger(EmbeddingService.name);

    async onModuleInit() {
        if (process.env.EMBEDDING_MODEL && process.env.EMBEDDING_BASE_URL && process.env.EMBEDDING_API_KEY) {
            this.embeddings = this.createEmbedding(process.env.EMBEDDING_MODEL, process.env.EMBEDDING_BASE_URL, process.env.EMBEDDING_API_KEY);
            this.logger.log(`初始化默认嵌入服务，配置信息：MODEL=${process.env.EMBEDDING_MODEL}, BASE_URL=${process.env.EMBEDDING_BASE_URL}`);
        } else {
            this.logger.log('未配置嵌入服务');
        }
    }

    /**
     * 创建OpenAIEmbeddings实例
     * @param model 模型名称
     * @param baseURL 基础URL
     * @param apiKey API密钥
     * @returns OpenAIEmbeddings实例
     */
    createEmbedding(model: string, baseURL: string, apiKey: string): OpenAIEmbeddings {
        return new OpenAIEmbeddings({
            model: model,
            configuration: {
                baseURL: baseURL,
                apiKey: apiKey
            },
            encodingFormat: 'float'
        });
    }

    /**
     * 更新嵌入服务模型
     * @param model 新的模型名称
     * @param baseURL 新的基础URL
     * @param apiKey 新的API密钥
     */
    async updateEmbeddingModel(embedding: OpenAIEmbeddings): Promise<OpenAIEmbeddings> {
        this.embeddings = embedding;
        return this.embeddings;
    }

    /**
     * 获取当前嵌入服务模型
     * @returns 当前的OpenAIEmbeddings实例
     */
    getEmbeddings(): OpenAIEmbeddings {
        return this.embeddings;
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
