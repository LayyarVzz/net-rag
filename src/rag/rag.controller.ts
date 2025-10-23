import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) { }

  @Get('name')
  getName() {
    return this.ragService.getName();
  }
}
