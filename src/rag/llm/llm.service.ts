// llm.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// 定义 Prompt 模板接口
export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  inputVariables: string[];
}

// 定义聊天消息接口
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private chatModel: ChatOpenAI;
  private isInitialized = false;
  private promptTemplates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultPrompts();
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
        throw new Error('API_KEY is required for OneAPI service');
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

      this.isInitialized = true;
      this.logger.log(`LLM service initialized with OneAPI: ${modelName} at ${baseURL}`);
    } catch (error) {
      this.logger.error('Failed to initialize LLM service with OneAPI', error);
      throw error;
    }
  }

  /**
   * 初始化默认的 prompt 模板
   */
  private initializeDefaultPrompts(): void {
    const defaultPrompts: PromptTemplate[] = [
      {
        name: 'general-chat',
        description: '通用聊天对话',
        template: `你是一个有帮助的AI助手。请根据以下对话历史和用户问题提供有用的回答。

对话历史：
{chatHistory}

当前问题：{userQuestion}

请提供有帮助、准确且简洁的回答：`,
        inputVariables: ['chatHistory', 'userQuestion']
      },
      {
        name: 'rag-chat',
        description: '基于检索结果的对话',
        template: `请基于以下检索结果回答用户问题：

用户问题：{userQuestion}

相关文档片段：
{chunks}

回答要求：
1. 基于提供的文档片段回答问题
2. 如果文档片段中包含相关信息，请引用这些信息
3. 如果文档片段中没有足够信息，请如实告知用户
4. 回答要简洁、准确、有依据

回答：`,
        inputVariables: ['userQuestion', 'chunks']
      }
    ];

    defaultPrompts.forEach(prompt => {
      this.promptTemplates.set(prompt.name, prompt);
    });

    this.logger.log(`Initialized ${this.promptTemplates.size} default prompt templates`);
  }

  /**
   * 添加自定义 prompt 模板
   */
  addPromptTemplate(template: PromptTemplate): void {
    this.promptTemplates.set(template.name, template);
    this.logger.log(`Prompt template '${template.name}' added`);
  }

  /**
   * 获取 prompt 模板
   */
  getPromptTemplate(name: string): PromptTemplate | undefined {
    return this.promptTemplates.get(name);
  }

  /**
   * 获取所有可用的 prompt 模板名称
   */
  getAvailablePrompts(): string[] {
    return Array.from(this.promptTemplates.keys());
  }

  /**
   * 使用特定 prompt 模板生成响应
   */
  async generateWithPrompt(
    promptName: string, 
    variables: Record<string, any>
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('LLM service not initialized');
    }

    const template = this.promptTemplates.get(promptName);
    if (!template) {
      throw new Error(`Prompt template '${promptName}' not found`);
    }

    // 验证必需的输入变量
    const missingVars = template.inputVariables.filter(
      varName => !(varName in variables)
    );
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required variables for prompt '${promptName}': ${missingVars.join(', ')}`
      );
    }

    try {
      const prompt = ChatPromptTemplate.fromTemplate(template.template);
      const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());
      
      const result = await chain.invoke(variables);
      this.logger.log(`Generated response using prompt '${promptName}'`);
      return result;
    } catch (error) {
      this.logger.error(`Error generating with prompt '${promptName}'`, error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * 通用聊天方法
   */
  async chat(
    userQuestion: string, 
    chatHistory: ChatMessage[] = []
  ): Promise<string> {
    const historyString = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return this.generateWithPrompt('general-chat', {
      chatHistory: historyString || '无对话历史',
      userQuestion
    });
  }

  /**
   * 基于检索结果的聊天
   */
  async ragChat(
    userQuestion: string,
    chunks: string[]
  ): Promise<string> {
    return this.generateWithPrompt('rag-chat', {
      userQuestion,
      chunks: chunks.join('\n\n')
    });
  }

  /**
   * 直接调用模型（原始接口）
   */
  async directInvoke(messages: ChatMessage[]): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('LLM service not initialized');
    }

    try {
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
   * 检查服务状态
   */
  getStatus(): { 
    initialized: boolean; 
    model: string; 
    baseURL: string;
    promptCount: number;
    availablePrompts: string[];
  } {
    return {
      initialized: this.isInitialized,
      model: process.env.LLM_MODEL || 'unknown',
      baseURL: process.env.BASE_URL || 'unknown',
      promptCount: this.promptTemplates.size,
      availablePrompts: this.getAvailablePrompts()
    };
  }

  /**
   * 重新初始化模型（用于热更新配置）
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    this.initializeModel();
  }
}