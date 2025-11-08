// llm.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';

describe('LLMService', () => {
  let service: LlmService;

  // 保存原始环境变量
  const originalEnv = process.env;

  beforeEach(async () => {
    // 模拟 process.env
    process.env = {
      ...originalEnv,
      BASE_URL: 'http://localhost:3000/v1',
      LLM_MODEL: 'qwen3:1.7b',
      API_KEY: 'test-api_key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  afterEach(() => {
    // 恢复原始环境变量
    process.env = originalEnv;
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