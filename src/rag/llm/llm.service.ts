// llm.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * LLM 服务 - 基于 LangChain 的大语言模型接口服务
 * 
 * 核心功能接口：
 * 
 * Prompt 模板管理：
 * - addPromptTemplate() - 添加自定义提示词模板
 * - getPromptTemplate() - 获取指定模板配置
 * - getAvailablePrompts() - 获取所有可用模板名称
 * 
 * 智能对话：
 * - generateWithPrompt() - 使用指定模板生成响应
 * - chat() - 带历史上下文的聊天对话（里面调用generateWithPrompt()和普通对话提示general-chat）
 * - directInvoke() - 直接调用模型原始接口
 * 
 * 检索增强功能：
 * - generateRetrievalQuery() - 生成知识检索查询词
 * - summarizeRetrievalResults() - 总结检索结果为自然语言
 * 
 * 文档处理：
 * - generateStatisticsReport() - 生成统计数据分析报告
 * - generateDocumentUploadGuide() - 生成文档上传指南
 * 
 * 多模态支持：
 * - multimodalUnderstanding() - 多模态内容理解（图片+文本）
 * 
 * 系统管理：
 * - getStatus() - 获取服务状态和配置信息
 * - reinitialize() - 重新初始化模型（热更新）
 */

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
      // OneAPI 需要真实的 API_KEY 和正确的 baseURL
      const apiKey = process.env.API_KEY;
      const baseURL = process.env.BASE_URL; // http://localhost:3000/v1
      const modelName = process.env.LLM_MODEL; // qwen3:1.7b

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
          // OneAPI 可能需要额外的配置
          defaultHeaders: {
            'Content-Type': 'application/json',
            // 如果有需要，可以添加其他 headers
          },
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
        name: 'knowledge-retrieval-query',
        description: '基于用户问题生成检索关键词，用于知识检索',
        template: `基于以下信息生成检索查询词：
问题：{userQuestion}
上下文：{context}
返回结果数量：{topK}

要求：
1. 生成精准的检索关键词或短语，突出核心需求
2. 考虑上下文相关性，避免歧义
3. 输出格式仅保留查询词，无需额外说明

检索查询词：`,
        inputVariables: ['userQuestion', 'context', 'topK']
      },
      {
        name: 'retrieval-result-summary',
        description: '将检索结果整理为自然语言回答',
        template: `请基于检索结果回答用户问题，遵循以下规则：

用户问题：{userQuestion}

检索到的文档片段：
{retrievalResults}

处理规则：
1. 优先使用高相似度的结果（≥0.7），重要信息用引号标注
2. 明确标注信息来源（文档路径和片段索引）
3. 合并重复内容，按逻辑顺序组织
4. 若结果为空或相似度均<0.7，如实告知用户"未找到足够相关的文档片段"
5. 严格避免编造信息，对不确定的内容需明确说明
6. 回答要简洁、准确、有依据

基于检索结果的回答：`,
        inputVariables: ['userQuestion', 'retrievalResults']
      },
      {
        name: 'document-statistics-report',
        description: '将统计数据格式化为可读报告',
        template: `将以下统计数据转换为{detail}报告：

原始数据：{statsData}

报告要求：
1. {detail === 'detailed' ? '包含总文档数、总片段数、总存储大小及每个文档的详细信息' : '仅包含总文档数和总片段数的概览'}
2. 使用自然语言描述，避免直接罗列JSON数据
3. 格式清晰，使用适当的段落和项目符号
4. 突出关键指标，便于用户快速理解

统计报告：`,
        inputVariables: ['statsData', 'detail']
      },
      {
        name: 'document-ingest-guide',
        description: '指导用户正确上传文档',
        template: `请指导用户使用文档上传功能：

文件类型：{fileType}
文件URI示例：{fileUri}
文件Buffer说明：{fileBuffer}

上传指南：
1. 支持两种上传方式（二选一）：
   - 预签名URL：提供文件的预签名URL
   - 二进制Buffer：直接传递文件的二进制数据

2. 确认文件格式有效（仅支持PDF、DOCX）

3. 调用示例：
   \`\`\`javascript
   // 方式1：使用预签名URL上传
   {
     "fileUri": "{fileUri}"
   }

   // 方式2：使用文件Buffer上传  
   {
     "fileBuffer": {fileBuffer}
   }
   \`\`\`

4. 工具处理流程说明：
   - 自动获取文件内容
   - 验证文件合法性并检查是否重复上传
   - 解析文件内容并切分成片段
   - 生成向量嵌入并存储到向量数据库
   - 返回入库结果

请根据以上信息生成友好的用户指导：`,
        inputVariables: ['fileType', 'fileUri', 'fileBuffer']
      },
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
        name: 'multimodal-understanding',
        description: '多模态内容理解（包含图片）',
        template: `你是一个能够理解图片和文本的多模态AI助手。

用户输入：{userInput}
图片内容：{imageDescriptions}

请综合分析文本和图片内容，提供全面的回答。如果图片中包含重要信息，请在回答中详细描述。

回答：`,
        inputVariables: ['userInput', 'imageDescriptions']
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
    if (!this.isInitialized) {
      throw new Error('LLM service not initialized');
    }

    const historyString = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return this.generateWithPrompt('general-chat', {
      chatHistory: historyString || '无对话历史',
      userQuestion
    });
  }

  /**
   * 生成检索查询词
   */
  async generateRetrievalQuery(
    userQuestion: string,
    context?: string,
    topK: number = 5
  ): Promise<string> {
    return this.generateWithPrompt('knowledge-retrieval-query', {
      userQuestion,
      context: context || '无额外上下文',
      topK
    });
  }

  /**
   * 总结检索结果
   */
  async summarizeRetrievalResults(
    userQuestion: string,
    retrievalResults: any[]
  ): Promise<string> {
    return this.generateWithPrompt('retrieval-result-summary', {
      userQuestion,
      retrievalResults: JSON.stringify(retrievalResults, null, 2)
    });
  }

  /**
   * 生成统计报告
   */
  async generateStatisticsReport(
    statsData: any,
    detailed: boolean = false
  ): Promise<string> {
    return this.generateWithPrompt('document-statistics-report', {
      statsData: JSON.stringify(statsData, null, 2),
      detail: detailed ? 'detailed' : 'brief'
    });
  }

  /**
   * 生成文档上传指南
   */
  async generateDocumentUploadGuide(
    fileType: string,
    fileUri?: string,
    fileBuffer?: string
  ): Promise<string> {
    return this.generateWithPrompt('document-ingest-guide', {
      fileType,
      fileUri: fileUri || 'https://example.com/presigned-url/document.pdf',
      fileBuffer: fileBuffer || 'fs.readFileSync(\'/path/to/your/document.pdf\')'
    });
  }

  /**
   * 多模态理解方法（预留接口）
   */
  async multimodalUnderstanding(
    userInput: string,
    imageDescriptions: string[] = []
  ): Promise<string> {
    return this.generateWithPrompt('multimodal-understanding', {
      userInput,
      imageDescriptions: imageDescriptions.join('; ')
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
      model: process.env.LLM_MODEL || 'llama2',
      baseURL: process.env.BASE_URL || 'http://localhost:11434/v1',
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