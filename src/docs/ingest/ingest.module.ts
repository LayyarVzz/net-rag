import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestController } from './ingest.controller';
import { QdrantModule } from '../../rag/qdrant/qdrant.module' ;

@Module({
  imports: [QdrantModule],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule { }
