// llm.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;

  // 保存原始环境变量
  const originalEnv = process.env;

  beforeEach(async () => {
    // 模拟 process.env
    process.env = {
      ...originalEnv,
      BASE_URL: 'http://localhost:3000/v1',
      LLM_MODEL: 'qwen3:1.7b',
      API_KEY: '',
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
    expect(service).toBeInstanceOf(LlmService);
  });

  it('should have healthCheck method', async () => {
    expect(service.healthCheck).toBeDefined();
    expect(typeof service.healthCheck).toBe('function');
  });

  it('should have chat method', () => {
    expect(service.chat).toBeDefined();
  });

  it('should have ragChat method', () => {
    expect(service.ragChat).toBeDefined();
  });

  it('should have directInvoke method', () => {
    expect(service.directInvoke).toBeDefined();
  });
});