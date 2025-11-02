import { Test, TestingModule } from '@nestjs/testing';
import { ParseDocController } from './parse-doc.controller';
import { ParseDocService } from './parse-doc.service';

describe('ParseDocController', () => {
  let controller: ParseDocController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParseDocController],
      providers: [ParseDocService],
    }).compile();

    controller = module.get<ParseDocController>(ParseDocController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
