# 贡献指南

感谢你对 AgentKit47（ak47）的兴趣！本指南将帮助你快速搭建本地开发环境并参与贡献。

---

## 环境要求

- **Node.js**: >= 20.19.0
- **npm**: >= 10.0.0
- **Git**: >= 2.30.0

---

## 本地开发

### 1. 克隆仓库

```bash
git clone https://github.com/andyxai/AgentKit47-Qoder.git
cd AgentKit47
```

### 2. 安装依赖

```bash
npm install
```

### 3. 编译项目

```bash
npm run build
```

---

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 编译 TypeScript 到 `dist/` |
| `npm run dev` | 监听模式，保存时自动编译 |
| `npm test` | 以交互模式运行 Vitest 测试 |
| `npm run test:run` | 以非交互模式一次性运行全部测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run format` | 运行 Prettier 自动格式化代码 |

---

## 项目结构

```
src/
├── cli/              # CLI 入口和命令实现（init / change / config / validate / upgrade）
├── core/
│   ├── scanner/      # 项目扫描器（技术栈检测、结构分析、平台探测）
│   ├── recommender/  # 能力单元推荐器（规则引擎 + L1/L2/L3 范式预设）
│   ├── generator/    # 模板生成器（Mustache 引擎 + 文件规划 + 快照管理）
│   ├── orchestrator/ # 流程编排器（流程编排 + 进度追踪）
│   ├── validator/    # 配置验证器（项目配置验证与一致性检查）
│   ├── flows/        # 流程定义（L1/L2/L3 变更流程）
│   ├── config-manager/ # 配置管理器（CRUD + 备份 + 验证）
│   └── upgrader/     # 升级管理器（SHA256 对比 + 三路 diff + 5 种策略）
├── types/            # 共享类型定义
└── utils/            # 工具函数
```

---

## 代码规范

本项目使用 ESLint v9 + Prettier 进行代码质量控制。

- **提交前必须运行**：`npm run lint` 和 `npm run format`
- 遵循现有代码风格，保持一致的命名和格式
- TypeScript 启用 strict 模式，类型定义需完整准确

---

## 测试要求

- **新功能必须包含测试**：单元测试或集成测试均可
- 所有测试必须通过：`npm run test:run` 应返回 0 个失败
- 现有 162 个测试为基准，新增功能不应破坏已有测试

---

## 提交规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，description 使用中文。

### 格式

```
<type>(<scope>): <中文描述>

[可选的详细描述]
```

### Type 清单

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 仅文档变更 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 代码重构（不改变外部行为） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统或外部依赖变更 |
| `ci` | CI/CD 配置变更 |
| `chore` | 构建/工具/依赖等杂项 |
| `revert` | 回退之前的提交 |

### 好的示例

```bash
git commit -m "feat(init): 新增需求盘问流程"
git commit -m "fix(core): 修复模板渲染边界情况"
git commit -m "docs: 更新 README 安装说明"
git commit -m "refactor(config): 提取路径解析为共享工具"
```

### 不好的示例

```bash
git commit -m "update code"                      # 太笼统，没有说明改了什么
git commit -m "fix bug"                          # 没有上下文，无法定位
git commit -m "feat(init): add requirement flow" # 描述应为中文
```

---

## 分支策略

1. **创建功能分支**：从 `main` 分支创建，命名建议 `feat/xxx` 或 `fix/xxx`
2. **开发并测试**：在分支上完成开发，确保 `npm run test:run` 全部通过
3. **提交 Pull Request**：向 `main` 分支发起 PR，描述变更内容
4. **Code Review**：至少 1 人 review 通过
5. **合并**：review 通过后合并到 `main`

---

## 问题反馈

如发现 bug 或有功能建议，欢迎通过仓库 Issue 或联系作者反馈。

- **作者**: andy.zx
- **仓库**: https://github.com/andyxai/AgentKit47-Qoder.git
