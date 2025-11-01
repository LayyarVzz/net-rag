import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);

    echoFile(file: Express.Multer.File) {
        this.logger.log(`文件上传成功: ${file.originalname}`);
        return {
            message: '文件上传成功',
            originalname: file.originalname,
            filename: file.filename,
        }
    }
}
