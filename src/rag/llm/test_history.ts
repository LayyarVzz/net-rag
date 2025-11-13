// test_llm_history.ts
import { LlmService } from './llm.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function testLlmHistory() {
  console.log('🧪 测试 LLM 历史记录功能\n');
  
  const llm = new LlmService();
  
  // 测试1: 基本对话
  console.log('1. 测试基本对话...');
  const response1 = await llm.chat('我叫张三，来自北京');
  console.log('助手回复:', response1);
  console.log('当前历史记录:', llm['chatHistory'].length, '条消息\n');
  
  // 测试2: 上下文记忆
  console.log('2. 测试上下文记忆...');
  const response2 = await llm.chat('我刚才说我叫什么名字？');
  console.log('助手回复:', response2);
  console.log('当前历史记录:', llm['chatHistory'].length, '条消息\n');
  
  // 测试3: RAG 对话
  console.log('3. 测试 RAG 对话...');
  const mockChunks = [
    'Python是一种高级编程语言，由Guido van Rossum于1991年创建。',
    'Python以简洁易读的语法著称，广泛用于Web开发、数据科学、人工智能等领域。',
    '但是Python的运行效率比C++低'
  ];
  const response3 = await llm.ragChat('Python是什么语言？', mockChunks);
  console.log('助手回复:', response3);
  console.log('当前历史记录:', llm['chatHistory'].length, '条消息\n');
  
  // 测试4: 连续对话测试历史截断
  console.log('4. 测试连续对话...');
  for (let i = 1; i <= 15; i++) {
    await llm.chat(`这是第${i}轮测试对话`);
    console.log(`第${i}轮对话后历史记录: ${llm['chatHistory'].length} 条消息`);
  }
  
  // 测试5: 验证历史是否被正确截断
  console.log('\n5. 验证历史截断...');
  const finalHistory = llm['chatHistory'];
  console.log('最终历史记录长度:', finalHistory.length, '条消息');
  console.log('应该不超过 20 条消息 (10轮对话)');
  
  // 显示最后几条消息
  console.log('\n最后5条消息:');
  finalHistory.slice(-5).forEach((msg, index) => {
    console.log(`  ${finalHistory.length - 4 + index}. [${msg.role}] ${msg.content.substring(0, 30)}...`);
  });
  
  console.log('\n✅ 测试完成！');
}

// 运行测试
testLlmHistory().catch(error => {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
});