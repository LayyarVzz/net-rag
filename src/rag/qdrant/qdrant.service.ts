import { Injectable, OnModuleInit, Logger, HttpException, HttpStatus, Param } from '@nestjs/common';
import { QdrantVectorStore } from '@langchain/qdrant';
import { EmbeddingInterface } from '../embedding/embedding.service';//调用接口??
import { Document } from "@langchain/document";
import { DocumentInterface } from "@langchain/core/documents";

interface QdrantConfig{
    embeddings:EmbeddingInterface;
}
@Injectable()
export class QdrantService implements OnModuleInit,EmbeddingInterface {
    private vectorStore: QdrantVectorStore;//存储向量的实例
    private readonly logger = new Logger(QdrantService.name);//日志记录

    // 构造函数，接收嵌入模型
    constructor(private readonly config: QdrantConfig) {}
    // nestjs生命周期函数,模块初始化时调用
    async onModuleInit() {
        try{
            this.vectorStore = await QdrantVectorStore.(
                this.config.embeddings,//调入模型实例
                {
                    url: process.env.QDRANT_URL,//环境变量
                    collectionsName: process.env.QDRANT_COLLECTION_NAME,
                }
            );
        }catch(error){
            //记录错误日志
            this.logger.error('Qdrant向量数据库初始化失败',error.message);
            // 抛出http异常
            throw new HttpException(
                '文档嵌入处理失败，请稍后再试',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
            
        }
    }

    /**
    * 添加文档到 Qdrant 向量数据库
    * @param documents Document 类型数组
    */
   async addDocuments(documents:Document[]):Promise<void>{
        try{
            //添加文档
            return await this.vectorStore.addDocuments(documents);
        }catch(error){
            //输出错误信息
            this.logger.error('添加文档到Qdrant失败',error.message);
            throw new HttpException(
                '添加文档失败，请稍后再试',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 相似性搜索
     * @param query 查询字符串
     * @param k 返回结果数量，默认为 4
     * @returns DocumentInterface 数组
     */
    async similaritySearch(query:string,k:number):Promise<DocumentInterface[]>{
        try{
            //进行相似性搜索
            return await this.vectorStore.similaritySearch(query,k);
        }catch(error){
            //输出错误信息
            this.logger.error('相似性搜索失败',error.message);
            throw new HttpException(
                '相似性搜索失败，请稍后再试',
                HttpStatus.INTERNAL_SERVER_ERROR
            );

        }
    }
 }
