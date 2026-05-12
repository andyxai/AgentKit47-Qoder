# AgentKit47 依赖管理文档

## 概述

本文档记录 AgentKit47 项目所依赖的外部框架及其版本信息。项目使用**本地副本**方式管理参考项目，确保版本可控和离线可查阅。

## 依赖清单

### 研究参考项目（本地副本，存放在 research-projects/）

#### 1. OpenSpec

- **包名**: `@fission-ai/openspec`
- **当前版本**: `v1.3.1`
- **Git Commit**: `3c7a05c5dc88b2397c478805890b55ed392b19e8`
- **用途**: Spec-driven 开发框架，用于需求规格管理和变更追踪
- **Git 仓库**: https://github.com/Fission-AI/OpenSpec.git
- **本地路径**: `research-projects/openspec/`
- **锁定时间**: 2026-04-28
- **管理方式**: Git 本地副本

#### 2. Superpowers

- **项目名称**: `superpowers`
- **当前版本**: `v5.0.7`
- **Git Commit**: `1f20bef3f59b85ad7b52718f822e37c4478a3ff5`
- **用途**: AI Agent 能力增强框架，提供 Agent 协作和技能管理
- **Git 仓库**: https://github.com/obra/superpowers.git
- **本地路径**: `research-projects/superpowers/`
- **锁定时间**: 2026-04-28
- **管理方式**: Git 本地副本

### 研究参考项目（静态副本）

#### 3. Agency Agents

- **项目名称**: Agency Agents
- **用途**: 多领域 AI Agent 模板集合（学术、设计、工程、营销等）
- **Git 仓库**: 待确认
- **本地路径**: `research-projects/agency-agents-main/`
- **版本信息**: 基于下载时的最新分支/标签
- **管理方式**: 静态副本（非 Git Submodule）
- **说明**: 此项目为研究参考，不作为运行时依赖

#### 4. GStack

- **项目名称**: GStack
- **用途**: Git 工作流和代码审查工具集
- **Git 仓库**: 待确认
- **本地路径**: `research-projects/gstack-main/`
- **版本信息**: 基于下载时的最新分支/标签
- **管理方式**: 静态副本（非 Git Submodule）
- **说明**: 此项目为研究参考，不作为运行时依赖

### 版本管理策略

### 锁定机制

1. **本地副本**: 所有参考项目通过 Git 本地副本管理，存放在 `research-projects/` 目录
2. **版本记录**: 在 README.md 中记录各项目的版本信息
3. **research-projects/**: 统一存放所有第三方研究参考项目

### 版本升级流程

1. **评估升级需求**
   - 检查新版本的功能改进和 breaking changes
   - 评估对现有功能的影响

2. **更新本地副本**
   ```bash
   # 进入项目目录
   cd research-projects/openspec
   
   # 拉取并切换到新版本 tag
   git fetch
   git checkout v<new-version>
   
   # 返回主项目并提交
   cd ../..
   git add research-projects/
   git commit -m "chore: upgrade openspec to v<new-version>"
   ```

3. **兼容性测试**
   - 检查是否有 breaking changes
   - 验证相关功能正常工作
   - 更新文档

4. **提交变更**
   - 提交更新后的 submodule 引用
   - 更新 `DEPENDENCIES.md` 中的版本信息

### 注意事项

1. **版本一致性**: 本地副本锁定到具体的 commit hash，确保版本可重现
2. **离线使用**: 克隆后即可离线浏览和参考
3. **Breaking Changes**: 关注每个框架的 CHANGELOG，特别注意主要版本升级带来的破坏性变更
4. **定制开发**: 如需对参考项目进行定制，可在本地副本中创建分支，或通过 fork 的方式管理
5. **非运行时依赖**: 这些项目仅供研究参考，不参与代码构建或运行时

## 依赖用途说明

### OpenSpec
- Spec-driven 开发方法论的实现
- 需求规格的结构化管理
- 变更提案的追踪和合并
- 与 AI Agent 工作流的集成

### Superpowers
- AI Agent 能力扩展框架
- 多 Agent 协作机制
- 技能（Skills）管理系统
- 与各种 AI 编码工具的集成（Claude、Cursor、Codex 等）

### Agency Agents（参考）
- 各领域专业 Agent 的 prompt 模板
- 覆盖学术、设计、工程、营销等多个领域
- 作为 Agent 设计的参考和学习材料

### GStack（参考）
- Git 工作流自动化工具
- 代码审查和质量管理
- 部署和发布流程
- 作为工具链设计的参考

## 维护责任

- **维护人**: AgentKit47 团队
- **检查频率**: 定期检查各项目是否有新版本
- **安全更新**: 发现安全漏洞时立即升级
- **兼容性**: 确保所有参考项目与项目设计理念的兼容性

## 历史版本记录

| 日期 | OpenSpec 版本 | Superpowers 版本 | 管理方式 | 备注 |
|------|--------------|------------------|---------|------|
| 2026-05-03 | v1.3.1 | v5.0.7 | 本地副本 | 统一存放在 research-projects/ 目录 |
| 2026-04-28 | v1.3.1 | v5.0.7 | Git Submodule | 初始方案（已废弃） |
