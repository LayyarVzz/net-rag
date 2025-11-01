// llm.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';

// 在测试前设置环境变量
process.env.BASE_URL = 'http://localhost:3000/v1';
process.env.LLM_MODEL = 'qwen3:1.7b';
process.env.API_KEY = 'sk-VigNRtfFYhZmRm1I9964D5399e844dB78fAb07B6Ea675816';

describe('LLMService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize successfully', () => {
    const status = service.getStatus();
    expect(status.initialized).toBe(true);
  });

  it('should return available prompts', () => {
    const prompts = service.getAvailablePrompts();
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBeGreaterThan(0);
  });
});