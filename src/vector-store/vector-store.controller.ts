import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { CreateVectorStoreDto } from './dto/create-vector-store.dto';
import { UpdateVectorStoreDto } from './dto/update-vector-store.dto';

@Controller('vector-store')
export class VectorStoreController {
  constructor(private readonly vectorStoreService: VectorStoreService) { }

}
