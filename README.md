<div align="center">

# Net-RAG 知识文档系统

> 一个基于 RAG 技术的知识文档程序，使用 NestJS 框架开发，集成 Langchain 和 Qdrant 向量数据库。

</div>

## 📁 项目架构

```
src/
├── app.module.ts                 # 根模块，整合整个应用的所有模块
├── main.ts                       # 应用入口文件，启动NestJS应用
├── docs/                         # 文档相关功能模块
│   ├── ingest/                   # 文档摄取处理模块（负责处理已上传文档的进一步操作）
│   └── upload/                   # 文档上传模块（处理用户上传文档）
└── rag/                          # RAG核心功能模块
    ├── embedding/                # 嵌入服务模块（负责将文本转换为向量）
    ├── llm/                      # 大语言模型服务模块（与LLM交互）
    ├── qdrant/                   # Qdrant向量数据库服务模块（存储和检索向量数据）
    ├── rag.controller.ts         # RAG控制器（处理HTTP请求）
    ├── rag.service.ts            # RAG服务（业务逻辑处理）
    ├── rag.module.ts             # RAG模块定义（导入所需子模块）
    ├── rag.controller.spec.ts    # RAG控制器测试文件
    └── rag.service.spec.ts       # RAG服务测试文件
```

## 🧩 模块详细说明

### 📥 Ingest Module (文档摄入模块)
>负责文档的接收、解析和预处理
- 文档上传与接收
- 文本提取与清洗
- 文档分块处理

### 🧠 Embedding Module (向量化模块)
>处理文本到向量的转换
- 集成多种嵌入模型
- 文本向量化处理
- 向量维度管理

### 💾 Vector Store Module (向量存储模块)
>与 Qdrant 向量数据库交互
- 向量数据存储
- 相似性检索
- 向量索引管理

### 🔍 RAG Module (RAG 核心模块)
>实现检索增强生成的核心逻辑
- 查询理解与处理
- 向量检索与重排序
- 答案生成与优化

## 🚀 常用开发命令

### 🛠️ 构建与运行
```bash
# 编译项目
npm run build

# 启动开发服务器 (热重载)
npm run start:dev

# 启动调试模式
npm run start:debug

# 启动生产环境
npm run start:prod
```

### 🎨 代码质量
```bash
# 代码格式化
npm run format

# 代码风格检查
npm run lint
```

### 🧪 测试相关
```bash
# 运行所有测试
npm run test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:cov

# 调试模式运行测试
npm run test:debug

# 运行端到端测试
npm run test:e2e
```

## ⚙️ 环境配置

项目使用 `.env` 文件进行环境配置，通过 `@nestjs/config` 模块加载。