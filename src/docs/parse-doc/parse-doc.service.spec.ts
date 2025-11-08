import { Test, TestingModule } from '@nestjs/testing';
import { ParseDocService } from './parse-doc.service';

describe('ParseDocService', () => {
  let service: ParseDocService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseDocService],
    }).compile();

    service = module.get<ParseDocService>(ParseDocService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
