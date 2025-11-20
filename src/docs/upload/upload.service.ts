import { Injectable, Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { url } from 'inspector';
import { join } from 'path';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private getFileType (mimetype:string):string{
        switch(mimetype){
            case 'application/pdf':
                return 'pdf';
            case 'application/msword':
                return 'docx';
            case 'application/octet-stream':
                return 'md';
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return 'docx';
            default:{
                return 'unknown';
            }
        }
    }
    echoFile(file: Express.Multer.File) {
        this.logger.log(`文件上传成功: ${file.filename}`);

        let filetype = this.getFileType(file.mimetype);
         const filePath = join('E:', 'NET_RAG-', 'net-rag', 'uploads', filetype, file.filename);
        const url = `${filePath.replace(/\\/g, '/')}`;  // URL 格式E:\NET_RAG-\net-rag\uploads
        return {
            message: '文件上传成功',
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            url:url
        }
    }

    dleFile(filetype: string, filename: string) {
        const filePath = join('./uploads', filetype, filename);
        if (existsSync(filePath)) {
            try {
                unlinkSync(filePath);
                this.logger.log(`文件删除成功: ${filePath}`);
                return {
                    message: '文件删除成功',
                    filename,
                    filePath,
                    filetype,
                };
            } catch (error) {
                this.logger.error(`文件删除失败: ${filePath}`, error);
                throw new Error('文件删除失败');
            }
        } else {
            this.logger.warn(`尝试删除不存在的文件: ${filePath}`);
            return {
                message: '尝试删除不存在的文件',
                filename,
                filePath,
                filetype,
            };
        }
    }
}
