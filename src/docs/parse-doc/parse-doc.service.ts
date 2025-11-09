import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

@Injectable()
export class ParseDocService {
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