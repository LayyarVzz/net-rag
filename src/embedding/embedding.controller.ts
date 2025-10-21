import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { UpdateEmbeddingDto } from './dto/update-embedding.dto';

@Controller('embedding')
export class EmbeddingController {
  constructor(private readonly embeddingService: EmbeddingService) { }

}
