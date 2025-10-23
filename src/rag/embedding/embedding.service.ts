import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
    name() {
        return 'embedding';
    }
}
