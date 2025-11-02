import { Module } from '@nestjs/common';
import { ParseDocService } from './parse-doc.service';
import { ParseDocController } from './parse-doc.controller';

@Module({
  controllers: [ParseDocController],
  providers: [ParseDocService],
})
export class ParseDocModule {}
