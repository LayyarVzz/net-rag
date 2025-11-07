import { Injectable, Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);

    echoFile(file: Express.Multer.File) {
        this.logger.log(`文件上传成功: ${file.originalname}`);
        return {
            message: '文件上传成功',
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
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
