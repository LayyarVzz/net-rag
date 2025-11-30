// llm.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
// 在 llm.service.ts 中添加环境变量加载
import { config } from 'dotenv';

// 在文件顶部添加
config();

// 定义聊天消息接口
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private chatModel: ChatOpenAI;

  // 存储对话历史
  private chatHistory: ChatMessage[] = [];
  // 最大对话轮数（每轮包含用户消息和助手回复）
  private readonly maxHistoryRounds = 10;

  constructor() {
    if (process.env.API_KEY && process.env.BASE_URL && process.env.LLM_MODEL) {
      this.logger.log('使用默认环境变量');
      this.initializeModel();
    } else {
      this.logger.warn('未配置默认API_KEY、BASE_URL或LLM_MODEL环境变量');
    }
  }

  /**
   * 初始化模型
   */
  initializeModel(): void {
    try {
      const apiKey = process.env.API_KEY;
      const baseURL = process.env.BASE_URL;
      const model = process.env.LLM_MODEL;

      this.logger.log(`初始化LLM模型参数:model=${model}, baseURL=${baseURL}`);
      if (!apiKey) {
        this.logger.warn('API_KEY is required');
      }
      if (!baseURL) {
        this.logger.warn('BASE_URL is required');
      }
      if (!model) {
        this.logger.warn('LLM_MODEL is required');
      }

      this.chatModel = new ChatOpenAI({
        model: model,
        configuration: {
          baseURL: baseURL,
          apiKey: apiKey
        }
      });

      this.logger.log(`LLM service initialized with OneAPI: ${model} at ${baseURL}`);
    } catch (error) {
      this.logger.error('Failed to initialize LLM service with OneAPI', error);
      throw error;
    }
  }

  /**
   * 创建ChatOpenAI实例
   * @param model 模型名称
   * @param baseURL 基础URL
   * @param apiKey API密钥
   * @returns ChatOpenAI实例
   */
  createChat(model: string, baseURL: string, apiKey: string): ChatOpenAI {
    return new ChatOpenAI({
      model: model,
      configuration: {
        baseURL: baseURL,
        apiKey: apiKey
      }
    });
  }

  /**
   * 更新LLM模型
   * @param model 模型名称
   * @param baseURL 基础URL
   * @param apiKey API密钥
   * @returns ChatOpenAI实例
   */
  updateLLMModel(model: string, baseURL: string, apiKey: string): ChatOpenAI {
    this.chatModel = this.createChat(model, baseURL, apiKey);
    return this.chatModel;
  }

  /**
   * 截断历史记录，保留最新的消息
   */
  private truncateHistory(): void {
    const maxMessages = this.maxHistoryRounds * 2; // 每轮对话有2条消息（用户+助手）

    if (this.chatHistory.length > maxMessages) {
      const removedCount = this.chatHistory.length - maxMessages;
      this.chatHistory = this.chatHistory.slice(removedCount);
      this.logger.log(`历史记录已截断，移除了 ${removedCount} 条旧消息，当前保留 ${this.chatHistory.length} 条消息`);
    }
  }

  /**
   * 通用聊天方法 - 内部自动维护历史
   * @param userQuestion 用户问题
   * @returns 模型生成的回复内容
   */
  async chat(userQuestion: string): Promise<string> {
    try {
      // 添加用户消息到历史
      this.chatHistory.push({ role: 'user', content: userQuestion });

      // 构建对话历史字符串（在截断前构建，确保包含最新消息）
      const historyString = this.chatHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const template = `你是一个有帮助的AI助手。请根据以下对话历史和用户问题提供有用的回答。

对话历史：
${historyString}

当前问题：${userQuestion}

请提供有帮助、准确且简洁的回答：`;

      const prompt = ChatPromptTemplate.fromTemplate(template);
      const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());

      const result = await chain.invoke({
        chatHistory: historyString || '无对话历史',
        userQuestion
      });

      // 添加助手回复到历史
      this.chatHistory.push({ role: 'assistant', content: result });

      // 在完整的一轮对话结束后截断历史记录
      this.truncateHistory();

      this.logger.log(`Generated response successfully. 当前历史记录: ${this.chatHistory.length} 条消息`);
      return result;
    } catch (error) {
      this.logger.error('Error in chat method', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * 基于检索结果的聊天 - 内部自动维护历史
   * @param userQuestion 用户问题
   * @param chunks 检索到的文档片段数组
   * @returns 模型生成的回复内容
   */
  async ragChat(userQuestion: string, chunks: string[]): Promise<string> {
    try {
      // 添加用户消息到历史
      // this.logger.log('userQuestion:', userQuestion, 'chunks:', chunks);
      this.chatHistory.push({ role: 'user', content: userQuestion });
      const escapedChunks = chunks.map(chunk =>
        chunk
          .replace(/{/g, '{{')  // 错误：你使用了 \\\\{，应该是 {{
          .replace(/}/g, '}}')  // 错误：你使用了 \\\\}，应该是 }}

      )
      const template = `请基于以下检索结果回答用户问题：

用户问题：${userQuestion}

相关文档片段：
${escapedChunks}

回答要求：
1. 基于提供的文档片段回答问题
2. 如果文档片段中包含相关信息，请引用这些信息
3. 如果文档片段中没有足够信息，请如实告知用户
4. 回答要简洁、准确、有依据

回答：`;
      // console.log('template:', template);
      const prompt = ChatPromptTemplate.fromTemplate(template);

      const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());

      const result = await chain.invoke({
        userQuestion,
        chunks: chunks.join('\n\n')
      });

      // 添加助手回复到历史
      this.chatHistory.push({ role: 'assistant', content: result });

      // 在完整的一轮对话结束后截断历史记录
      this.truncateHistory();

      this.logger.log(`Generated RAG response successfully. 当前历史记录: ${this.chatHistory.length} 条消息`);
      return result;
    } catch (error) {
      this.logger.error('Error in ragChat method', error);
      throw new Error(`Failed to generate RAG response: ${error.message}`);
    }
  }

  /**
   * 直接调用模型（原始接口）
   * @param messages 包含用户和助手消息的数组
   * @returns 模型生成的回复内容
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
}