// llm.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// 定义聊天消息接口
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private chatModel: ChatOpenAI;

  constructor() {
    this.initializeModel();
  }

  /**
   * 初始化模型
   */
  private initializeModel(): void {
    try {
      const apiKey = process.env.API_KEY;
      const baseURL = process.env.BASE_URL;
      const modelName = process.env.LLM_MODEL;

      if (!apiKey) {
        throw new Error('API_KEY is required');
      }
      if (!baseURL) {
        throw new Error('BASE_URL is required');
      }
      if (!modelName) {
        throw new Error('LLM_MODEL_NAME is required');
      }

      this.chatModel = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        temperature: 0.1,
        maxTokens: 2000,
        configuration: {
          baseURL: baseURL,
        },
        maxRetries: 2,
        timeout: 30000,
      });

      this.logger.log(`LLM service initialized with OneAPI: ${modelName} at ${baseURL}`);
    } catch (error) {
      this.logger.error('Failed to initialize LLM service with OneAPI', error);
      throw error;
    }
  }

  /**
   * 通用聊天方法
   */
  async chat(
    userQuestion: string, 
    chatHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      const historyString = chatHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const template = `你是一个有帮助的AI助手。请根据以下对话历史和用户问题提供有用的回答。

对话历史：
{chatHistory}

当前问题：{userQuestion}

请提供有帮助、准确且简洁的回答：`;

      const prompt = ChatPromptTemplate.fromTemplate(template);
      const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        chatHistory: historyString || '无对话历史',
        userQuestion
      });
      
      this.logger.log('Generated response successfully');
      return result;
    } catch (error) {
      this.logger.error('Error in chat method', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * 基于检索结果的聊天
   */
  async ragChat(
    userQuestion: string,
    chunks: string[]
  ): Promise<string> {
    try {
      const template = `请基于以下检索结果回答用户问题：

用户问题：{userQuestion}

相关文档片段：
{chunks}

回答要求：
1. 基于提供的文档片段回答问题
2. 如果文档片段中包含相关信息，请引用这些信息
3. 如果文档片段中没有足够信息，请如实告知用户
4. 回答要简洁、准确、有依据

回答：`;

      const prompt = ChatPromptTemplate.fromTemplate(template);
      const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        userQuestion,
        chunks: chunks.join('\n\n')
      });
      
      this.logger.log('Generated RAG response successfully');
      return result;
    } catch (error) {
      this.logger.error('Error in ragChat method', error);
      throw new Error(`Failed to generate RAG response: ${error.message}`);
    }
  }

  /**
   * 直接调用模型（原始接口）
   */
  async directInvoke(messages: ChatMessage[]): Promise<string> {
    try {
      if (messages.length === 0) {
        throw new Error('Messages array cannot be empty');
      }
      const langchainMessages = messages.map(msg => {
        if (msg.role === 'user') {
          return { role: 'human', content: msg.content };
        } else {
          return { role: 'assistant', content: msg.content };
        }
      });

      const prompt = ChatPromptTemplate.fromMessages(langchainMessages);
      const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());
      
      const result = await chain.invoke({});
      return result;
    } catch (error) {
      this.logger.error('Error in direct model invocation', error);
      throw new Error(`Model invocation failed: ${error.message}`);
    }
  }

  /**
   * 检查模型是否可用
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testMessage = [{ role: 'user' as const, content: 'Hello' }];
      await this.directInvoke(testMessage);
      return true;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }
}