import { PartialType } from '@nestjs/mapped-types';
import { CreateIngestDto } from './create-ingest.dto';

export class UpdateIngestDto extends PartialType(CreateIngestDto) {}
