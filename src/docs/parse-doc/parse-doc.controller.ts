import { Controller } from '@nestjs/common';
import { ParseDocService } from './parse-doc.service';

@Controller('parse-doc')
export class ParseDocController {
  constructor(private readonly parseDocService: ParseDocService) {}
}
