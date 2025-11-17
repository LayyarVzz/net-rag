import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { QdrantService } from '../../rag/qdrant/qdrant.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

@Injectable()
export class IngestService {
    // 创建logger实例
    private readonly logger = new Logger(IngestService.name)
    // 构造函数,注入QdrantService依赖
    constructor(private readonly qdrantService: QdrantService) { }
    /**
     * 处理并将md文档入库
     * @param chunks 文档块数组
     * @param fileName 源文件名
     */
    async ingestMarkdownDocuments(chunks: string[], fileName: string): Promise<void> {
        try {
            //转换成Document格式数组
            const documents: Document[] = chunks.map((chunk, index) =>
                // 创建Document实例
                new Document({
                    // 文档主要内容
                    pageContent: chunk,
                    // 自定义数据信息
                    metadata: {
                        //源文件名
                        fileName: fileName,
                        // 处理时间的时间戳,转换成熟悉的年份-月份-日期-....这样的格式
                        timestamp: new Date().toISOString(),
                        // 文档块的索引
                        chunkIndex: index,
                    }
                })
            );
            // 添加文档到Qdrant向量数据库
            await this.qdrantService.addDocuments(documents);
            this.logger.log(`成功处理并注入 ${documents.length} 个文档块到向量数据库，源文件: ${fileName}`);
        } catch (error) {
            this.logger.error('处理文档块失败', error.message);
            // 抛出错误信息
            throw new HttpException(
                '处理文档块失败，请稍后再试',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * 分割Markdown文档
     * @param content Markdown文档内容
     * @param maxChunkSize 分块最大字符数
     * @param overlap 重叠的字符数
     * @returns 分割后的文档块
     */
    async splitMarkdown(content: string, maxChunkSize: number = 500,): Promise<string[]> {
        try {
            // 初始化结果数组
            const chunks: string[] = [];

            // 1.按三层标题来分割文档(#,##,###),保留分隔符
            // 使用正向先行断言,匹配格式(标题在行首,1~3个#号,后跟一个空格+标题,全局匹配)
            const sections = content.split(/(?=^#{1,3}\s)/gm);
            // 2.遍历每一个章节
            for (const section of sections) {
                // 跳过空章节
                if (section.trim().length === 0) continue;
                // 3.判断是否超过最大限制
                if (section.length > maxChunkSize) {
                    // 章节太大,进一步细分
                    // 按行提取
                    const lines = section.split('\n');
                    // 标题行(可能为空)
                    const header = lines[0] || '';
                    // 让每一块都以标题加换行符开头
                    let currentChunk = header + '\n';

                    // 处理剩余行
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i];
                        // 如果标题加上内容超出限制大小,就保存当前块新开一个块(注意当前行不能与标题行一样)
                        if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > header.length + 1) {
                            // 保存当前块(除去块开头 / 结尾的多余空白字符)
                            chunks.push(currentChunk.trim());
                            // 新建一个块,以标题开头,保持上下文
                            currentChunk = header + '\n' + line + '\n';
                        } else {
                            // 否则将行添加到当前块
                            currentChunk += line + '\n';
                        }
                    }

                    // 添加最后一个块(如果不为空)
                    if (currentChunk.trim()) {
                        chunks.push(currentChunk.trim());
                    }
                } else {
                    // 章节大小在限制范围内，直接添加到结果中
                    chunks.push(section.trim());
                }
            }
            // 返回分割后的文档块数组
            return chunks;
        } catch (error) {
            // 错误日志
            this.logger.error('文档分割失败', error.message);
            throw new HttpException(
                '文档分割失败',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
    * 直接从文件路径读取文档并进行分块,处理和入库
    * @param filePath 文件路径
    */
    async ingest(filePath: string): Promise<void> {
        try {
            // 检查文件是否存在
         try{
            await fs.access(filePath);
         } catch (error) {
            throw new HttpException(
               `文件不存在: ${filePath}`,
                HttpStatus.NOT_FOUND,
            );
         }
            const ext = path.extname(filePath).toLowerCase();
            let fileName = path.basename(filePath, ext);
            const dir = path.dirname(filePath);
            let content ='';
            const newFilePath = path.join(dir, `${fileName}-parsed.md`);
            
            // 检查是否为 md 文件,不是md文档就调用parseDocument
            if (ext == '.md') {
            // 读取文件内容
            content = await fs.readFile(filePath, 'utf-8');
            // 文件名作为源
            }else{
                await this.parseDocument(filePath);
                content = await fs.readFile(newFilePath, 'utf-8');
                fileName = path.basename(newFilePath, ext);
            }

            // 分割文档
            const chunks = await this.splitMarkdown(content);

            // 处理并入库文档
            await this.ingestMarkdownDocuments(chunks, fileName);

            this.logger.log(`成功处理并注入文件: ${filePath}`);
        } catch (error) {
            this.logger.error('文件处理失败', error.message);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                '文件处理失败，请稍后再试',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
      /**
   * 将指定路径的文档转换为markdown格式
   */
  async parseDocument(filePath: string): Promise<void> {
    try {
      // 检查文件是否存在
      await fs.access(filePath);

      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath, ext);
      const dir = path.dirname(filePath);

      const newFilePath = path.join(dir, `${fileName}-parsed.md`);

      let content = '';

      switch (ext) {
        case '.pdf':
          content = await this.parsePdf(filePath);
          break;
        case '.docx':
          content = await this.parseDocx(filePath);
          break;
        case '.doc':
          throw new Error('DOC格式需要额外的转换库支持');
        case '.txt':
          content = await this.parseTxt(filePath);
          break;
        default:
          throw new Error(`不支持的文件格式: ${ext}`);
      }

      content = this.removeImages(content);
      await fs.writeFile(newFilePath, content, 'utf-8');

      console.log(`文件转换完成: ${newFilePath}`);
    } catch (error) {
      throw new Error(`文档解析失败: ${error.message}`);
    }
  }

  /**
   * 解析PDF文件 - 修正版本
   */
  private async parsePdf(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF解析错误: ${error.message}`);
    }
  }

  /**
   * 解析DOCX文件
   */
  private async parseDocx(filePath: string): Promise<string> {
    try {
      const result = await mammoth.convertToHtml({ path: filePath });
      return this.htmlToMarkdown(result.value);
    } catch (error) {
      throw new Error(`DOCX解析错误: ${error.message}`);
    }
  }

  /**
   * 解析TXT文件
   */
  private async parseTxt(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`TXT读取错误: ${error.message}`);
    }
  }

  /**
   * 简单的HTML到Markdown转换
   */
  private htmlToMarkdown(html: string): string {
    let markdown = html.replace(/<img[^>]*>/g, '');

    markdown = markdown
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br[^>]*>/g, '\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
      .replace(/<[^>]+>/g, '');

    return markdown.trim();
  }

  /**
   * 移除markdown中的图片资源
   */
  private removeImages(content: string): string {
    content = content.replace(/!\[.*?\]\(.*?\)/g, '');
    content = content.replace(/<img[^>]*>/g, '');
    return content;
  }
}