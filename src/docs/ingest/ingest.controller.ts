import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) { }

}
