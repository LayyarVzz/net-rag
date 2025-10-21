import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { CreateIngestDto } from './dto/create-ingest.dto';
import { UpdateIngestDto } from './dto/update-ingest.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) { }

}
