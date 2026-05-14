# 更新日志

所有重要变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.6.8] - 2026-05-13

### 🐛 修复

- 同步脚本 `sync-to-github.sh` 增加 `src/cli/commands/update.ts` 到 URL 替换列表，清理 fallback 中的 GitLab 内网地址

### 📝 文档

- README 新增自我改进反馈体系、语气收敛调整
- CHANGELOG 补充 0.6.5-0.6.7 版本记录

## [0.6.7] - 2026-05-13

### ✨ 新增

- **门控规则体系**：新增 `gate-control.md` 规则文件，定义 11 个门控点（G1-G11）覆盖 4 个流程阶段，支持 L1/L2/L3 范式感知门控强度
  - `workflow-state.md` 的「Spec 审查门禁」节改为引用 `gate-control.md`，职责分离

- **关键 Skill 强制触发规则**：`core-behavior.md` 新增关键 Skill 禁止自判跳过表（entry-guard / change-classification / triage-brief / critical-review），明确 AI 必须解释+询问用户才可跳过

- **自我改进双 Skill 体系**：
  - `ak47-skill-improvement-proposal`：工具改进提案 Skill，支持交互复盘、四象限+问题类型双重分类、修改范围边界检查
  - `ak47-skill-improvement-audit`：改进审核 Skill，支持边界硬检查（不碰外部安装配置）、五档裁决（接纳/修改后接纳/暂缓/拒绝/转上游）、最终修改方案输出
  - AGENTS.md 注册两个新 Skill

- **变更分类强制触发**：`core-behavior.md` 新增变更分类触发条件与禁止行为，防止 AI 跳过分类直接出方案

### 📝 文档

- **README 新增自我改进反馈体系**：在「你的项目会获得什么？」新增一节
- **README 语气收敛**：去掉"专家""所有…都""深度诊断""确保"等绝对化表述，"框架级通用"改为"通用化方向"，"设计上就是"改为"在设计中留出了定制空间"

## [0.6.6] - 2026-05-13

### 🛠️ 模板优化

- **workflow-state.md**
  - 新增「Spec 审查门禁」章节，规定 artifacts complete 后必须经过批判性审查才能 apply

- **apply.md**
  - 移除「深层模块检查」，避免与 ak47-skill-anti-patterns 和 code-review 重复

- **skills/**
  - 移除 4 个 openspec skill 目录（openspec-apply-change、openspec-archive-change、openspec-explore、openspec-propose）
  - 这些 skills 由 `openspec init` 命令自动生成，不需要放在模板中

## [0.6.5] - 2026-05-12

### 📝 文档

- **学习文档语气调整**
  - 04-agent-task-delegation.md：去除个人踩坑叙事，改为中性表述
  - 08-brief-design-methodology.md：去除"最初就让AI开工""反复踩坑"等表述
  - 05-requirements-double-guarantee.md："早期问题"改为"背景问题"
  - index.md：模块格式说明中"踩坑经历"改为"实践经历"
  - 09-knowledge-ai-management.md："踩坑记录"改为"实践记录"
  - 10-architectural-decision-evolution.md："常见问题...才发现"改为"初始版本...需要调整"

## [0.6.4] - 2026-05-12

### 📝 文档

- **学习文档外部引用校准**
  - 修正 mattpocock/skills 数量描述（7 → 20 Skills）
  - 修正 gstack 目录数量描述（60 → 62 个目录，约 31 个 Skills）
  - 修正 spec-kit 扩展能力描述（明确 94 个社区扩展）
  - 修正 Superpowers Agent 编排描述（明确有自动触发机制）
  - 修正 OpenSpec 工作流阶段描述（移除错误的 L1/L2/L3 分级归属）
- **学习文档格式统一**
  - index.md 章节标题简化（去除 emoji 装饰）
  - 模块格式说明简化，更直接

## [0.6.3] - 2026-05-12

### 🔧 工具

- 新增 `scripts/release-guide.sh`：指导 GitHub 项目 AI 进行规范化语义化版本发布
- 新增 `scripts/github-push.sh`：GitHub 项目 AI 自动化 git add/commit/push 工具

### 🐛 修复

- 安装脚本远程标签获取失败时不再硬编码 v0.1.0，改为克隆默认分支
- 同步脚本修复 .git 目录保留逻辑，避免每次同步后丢失 git 历史

### 📝 文档

- 经验库与设计决策文档更新

## [0.6.2] - 2026-05-12

### 📝 文档

- **学习文档章节标题统一**
  - 全部模块章节标题从问句体（"这是什么？/怎么来的？/为什么有效？"）改为陈述体（"背景/来源/原理"），更简洁自然
  - 删除不再需要的"审核报告"文件
- **《代码大全2》模块重写**
  - 语气从"提炼/指南"转为"笔记/参考"，去掉"被誉为圣经""严格多源交叉验证"等过度表述
  - 表格和要点从带 ** 加粗的正式风格改为平实的口语化表达

## [0.6.1] - 2026-05-12

### 📝 文档

- **README 语气收敛**
  - 删除过度承诺表述："从零配置到完整"、"一键生成"、"100% 可审计"等改为谦虚措辞
  - 设计哲学新增"从个人使用整理出来"背景说明，坦承认知局限与迭代过程
  - Badge 下新增学习借鉴的开源项目引用（spec-kit、OpenSpec、mattpocock-skills、Superpowers、gstack）
  - 致谢补全 5 个项目 + 链接到详细对比文档

- **学习文档全面谦虚化**
  - 全部模块删除"告别""堵住""确保"等绝对化表述，改为"替代""减少""尝试"
  - 删除"独创""独特贡献"等自誉措辞，改为"做法""采用""尝试的一种方式"
  - "100%"类表述加限定词（"尽可能""尽量"）
  - 修正"双平台适配"为实际现状"Qoder 平台深度适配"

## [0.6.0] - 2026-05-12

### ✨ 新增

- **Fork 后一键替换 Git 仓库地址**
  - `install.sh` 自动检测克隆来源仓库地址，Fork 后零配置即可团队安装
  - `update.ts` 从 `package.json` 动态读取仓库 URL，`ak47 update` 自动适配 Fork 仓库
  - 新增 `sync-to-github.sh` 同步脚本，一键将 GitLab 仓库同步到 GitHub（自动检测源地址）
  - 新增 `replace-git-url` Skill，一键替换项目中所有 Git 依赖地址为 Fork 仓库地址
  - README 新增「团队定制」章节，指导 Fork 用户零配置改造

### 📝 文档

- **README 全面改版**
  - 新增视觉化 header（居中 logo + 版本/许可证/Node badge）
  - 新增目录导航，提升可读性
  - 内容重组：核心问题 → 快速开始 → CLI 参考 → 产出能力 → 设计哲学 → 团队定制
  - 项目结构展示优化为树形图，突出核心模块职责
  - 新增「致谢」章节

## [0.5.8] - 2026-05-11

### 🔧 优化

- **Git 提交规范统一为中文**
  - commit-msg hook 新增中文描述强制检查，英文描述直接拦截（`templates/git-hooks/commit-msg` + `.git/hooks/commit-msg`）
  - `CONTRIBUTING.md` 提交规范示例全部改为中文
  - `AGENTS.md`（root + template）提交规则改为 description 使用中文
  - `.ak47/config.yaml` 新增 `language: zh-CN` 字段，为后续英文版预留
  - 下游项目 `ak47 init` 时自动安装的 hook 同样强制中文

## [0.5.7] - 2026-05-11

### ✨ 新增

- **P0-3: 新项目需求盘问流程自动触发规则**
  - 在 `templates/qoder/rules/core-behavior.md` 中新增"新项目/老项目首次使用必须盘问（Requirements First）"章节
  - 定义 4 个触发条件（初始化完成 / 无代码目录 / PRD 为空 / 首次使用框架），任一满足即自动触发需求盘问
  - 定义必须执行步骤：加载 Skill → 多轮盘问(What/Why/Who) → 一次一问 → 总结确认
  - 定义 4 项禁止行为：禁止直接给标准流程建议、禁止未知背景给技术方案、禁止跳过盘问、禁止假设项目类型
  - 定义 3 个退出条件：业务目标明确 + AI 反向复述确认 + 达成共识
  - 更新 `templates/AGENTS.md` 配套规则索引，标注需求盘问规则
  - 规则随 `ak47 init` 自动注入到 `.qoder/rules/`，由 Qoder 平台自动注入到每次 AI 上下文

## [0.5.6] - 2026-05-11

### 🐛 修复

- **`ak47 init` 产出目录结构修复**
  - 移除 `templates/qoder/skills/openspec/` 子目录，消除 OpenSpec Skills 与 `openspec init` 双重注册导致的重复
  - 新增 `templates/prd/*.md.template` (3 个) 和 `templates/architecture/*.md.template` (3 个) ，修复宪法层文档渲染为空文件的问题
  - `renderConstitutionDocs()` 增加空模板守卫，防止未来模板缺失再产生空文件

## [0.5.3] - 2026-05-08

### ✨ 新增

- **mattpocock-skills 借鉴（建议 3 + 建议 5）**
  - 新增 `ak47-skill-triage-brief`（需求评估与 Brief 生成）
    - Agent Brief 模板（结构化任务说明）
    - Out-of-Scope 知识库（被拒功能持久化记录）
    - AI 标记机制（所有 AI 生成的评论必须标注来源）
    - 采用精简版策略，去除 Issue Tracker 依赖
  
  - 新增 `ak47-skill-improve-architecture`（架构深化发现）
    - 定期架构健康检查（7 天提醒）
    - 深层模块 vs 浅层模块识别
    - 删除测试（Deletion Test）
    - Grilling 循环（架构决策前深度盘问）
    - 混合触发机制（定期提醒 + 事件驱动）

- **宪法级文档双重保障机制**
  - 新增 `ak47-skill-requirements-definition`（需求定义 Skill）
    - 一次一问深度盘问
    - 术语一致性检查
    - 反向复述确认
    - 四要素验收标准（术语零歧义、需求可验证、反向复述通过、显式批准）
  
  - 新增 `ak47-skill-architecture-design`（架构设计 Skill）
    - 基于已批准的需求文档
    - 2-3 种方案对比
    - 分章节增量验证
    - 四要素验收标准（完整性、可追溯性、风险沟通、显式批准）
  
  - 新增 `ak47-skill-critical-review`（批判性审核 Skill）
    - 6 大维度批判性分析（假设/边界/替代方案/可维护性/风险/一致性）
    - 质疑清单分级（高/中/低优先级）
    - 用户回应流程（接受/拒绝/部分接受/讨论）
    - 通过标准（高优先级 100% 解决或用户确认接受风险）

### 🔄 重构

- **需求与架构分离**
  - 将原 `ak47-skill-requirements-grilling` 拆分为两个独立 Skill
  - 需求定义（What/Why/Who）与架构设计（How）明确分离
  - 增加明确的阶段门控和里程碑

- **AGENTS.md 更新**
  - 核心原则增加"宪法级文档双重保障机制"说明
  - Skill 1-3 重新定义为：需求定义、架构设计、批判性审核
  - 展示双重保障流程图
  - 标记 `requirements-grilling` 和 `brainstorming` 为已废弃

### 📝 文档

- **经验沉淀**
  - 新增 `.ak47/experiences/best-practices/BP-constitution-double-guarantee.md`
  - 记录双重保障机制设计、四要素验收标准、6 大审核维度
  - 更新 `.ak47/experiences/index.md` 索引

- **PROJECT-INTRO.md 更新**
  - 能力介绍更新：brainstorming → requirements-definition + architecture-design + critical-review
  - 场景 2 更新：反映新的 Skill 调用流程

### 🧹 清理

- 删除 `ak47-skill-requirements-grilling`（已被新 Skill 替代）

---

## [0.5.2] - 2026-05-07

### ✨ 新增

- **Agent/Skill 完全静态化**：从 Mustache 动态渲染改为直接拷贝静态模板
  - 移除 `templates/units/` 目录(14 个文件)
  - Agent/Skill 定义中去除所有 `{{projectName}}` 等项目变量
  - AGENTS.md 改为完全静态,写入固定的 8 个 Agent 和 24 个 Skill 列表
  - init 时直接从 `templates/qoder/` 拷贝,零渲染开销

- **模板目录彻底清理**
  - 删除 `templates/standards/` 目录(~35 个重复文件)
  - 删除 `templates/platforms/` 目录(Claude Code 支持已移除)
  - 删除 `templates/architecture/`、`templates/openspec/`、`templates/prd/` 等旧模板
  - Superpowers Skills 统一从 `templates/qoder/skills/` 读取

### 🔧 优化

- **去除冗余项目变量**：全面移除 `{{projectName}}` 变量
  - Agent/Skill description 改为通用描述(如 "ak47 架构师" 而非 "{{projectName}} 架构师")
  - experiences 索引文件标题改为 "ak47 知识资产索引"
  - workflow 提示信息去除项目名
  - 框架级通用性达到极致

- **代码简化**
  - `superpowers-installer.ts` 改为从 `templates/qoder/skills/` 读取
  - 移除 `ClaudeHookAdapter` 类和相关导出
  - `generateAgentsMd()` 从动态渲染改为直接拷贝
  - `generateWorkflowRules()` 和 `initializeExperiences()` 去除 projectName 参数

### 📝 文档

- **PROJECT-INTRO.md 全面对齐代码实现**
  - 能力 7 更新:移除多平台支持,突出 Qoder 静态化配置
  - 能力 8 更新:standards/ → .qoder/ + templates/rules/
  - 项目结构更新:反映真实的 templates/ 目录结构
  - 场景 4 更新:"切换平台" → "升级 AK47 配置"

### 🧹 清理

- 删除约 100+ 个废弃文件(templates/units/, templates/standards/, templates/platforms/ 等)
- 删除 Claude Code 平台支持相关代码
- 测试代码适配新架构(使用 rules 替代 agents 测试)

---

## [0.5.1] - 2026-05-07

### 修复

- **Hook 配置生成策略优化**：从 Mustache 模板动态渲染改为预配置 JSON 直接拷贝
  - 新增 `templates/platforms/qoder/settings-full.json`（包含所有默认 Hooks）
  - 消除 HTML 实体编码问题（`&#x2F;`、`&quot;` 等），100% 可靠
  - 简化 `QoderHookAdapter.generate()` 为直接读取预配置文件
  - 零转换策略：预配置 JSON → 直接拷贝 → 写入项目

- **专注 Qoder 平台**：移除多平台复杂性
  - 删除 Claude Code 平台相关代码和条件判断
  - 移除冗余的 `configureSessionStartHook` 和 `configureQoderSessionStartHook` 函数（74行）
  - 简化 `superpowers-installer.ts` 中的平台判断逻辑
  - 代码精简约 80 行

- **文档修复**：
  - 修复 `AGENTS.md` 中错误的 Hook 机制描述（UserPromptSubmit → SessionStart）
  - 新增 Qoder 专用 `session-start-qoder.sh` 脚本
  - 修复 Mustache 模板 `command` 字段的 HTML 转义问题（`{{command}}` → `{{{command}}}`）

### 技术债务

- 删除未使用的研究文档：`docs/research/multi-platform-comparison.md`
- 删除未使用的研究文档：`docs/research/superpowers-skills-inventory.md`

### 验证结果

✅ JSON 格式正确（通过 Python `json.load` 验证）  
✅ Hook 事件完整：PreToolUse, PostToolUse, SessionStart  
✅ SessionStart Hook 已配置  
✅ 无 HTML 实体编码  
✅ session-start 脚本已复制且可执行  
✅ 无 Claude Code 引用  

---

## [0.5.0] - 2026-05-07

### 新增

- **外部平台功能测试开放能力**：构建开放的验证插件架构
  - 验证类型注册：通过 `.ak47/config.yaml` 注册自定义验证类型
  - 多种执行器：支持 Agent、Skill、Script 三种执行器
  - 灵活触发：支持 auto（自动触发）和 manual（手动触发）
  - 失败策略：支持 warn-and-continue、block-archive、mark-risk 三种策略
  - 标准化接口：统一 ValidationResult 接口，便于归档和分析
  - 自动化归档：验证结果自动归档到 `.ak47/changes/<change-id>/validation/`
  
- **Config Manager 配置管理器**：通过专用工具管理用户自定义配置
  - 规范化配置：AI 与用户充分讨论后，通过 Config Manager 执行配置修改
  - 自动元数据：自动添加 `_custom`、`_created_at`、`_reason`、`_author` 标记
  - 升级保护：AK47 升级时自动识别和保护用户自定义配置
  - CLI 命令：`ak47 config-manager add-validation/add-agent/add-skill/list`
  - 独立配置文件：`.ak47/custom-configs.yaml` 存储用户自定义配置
  
- **AI 辅助配置修改流程**：建立人机协作的配置修改规范
  - 充分讨论：AI 必须先理解用户意图，不能自作主张
  - 方案确认：AI 设计方案并解释原因，用户确认后执行
  - 原因记录：AI 必须填写 `_reason` 字段记录修改原因
  - 对话模板：提供标准的对话模板，确保流程规范化

### 文档

- **验证指南**：`docs/guides/validation-guide.md` - 外部平台功能测试使用指南
- **配置管理指南**：`docs/guides/custom-config-management.md` - 自定义配置管理方案
- **AI 辅助配置流程**：`docs/guides/ai-assisted-config-management.md` - AI 辅助配置修改流程规范
- **QA 和验证体系**：`docs/guides/qa-and-validation.md` - AK47 质量保障体系说明
- **设计文档**：`docs/design/modules/custom-config-manager.md` - Config Manager 设计方案

### 模板

- **Config Manager Skill**：`templates/standards/skills/config-manager/SKILL.md` - 配置管理 Skill 模板
- **验证模板**：`templates/validation/` - 自定义验证 Agent/Skill 模板

### 测试

- **Config Manager 测试**：`tests/core/config-manager/config-manager.test.ts` - 10 个测试用例
- **Validation Orchestrator 测试**：`tests/core/validator/validation-orchestrator.test.ts` - 验证编排器测试

## [0.4.2] - 2026-05-07

### 新增

- **CLI 工具更新命令**：新增 `ak47 update` 命令，实现双层更新架构
  - 版本检测：检查远程最新版本
  - 自动安装：内置完整安装流程 (git clone → npm install → build → npm install -g)
  - 灵活选项：支持 `--check` (仅检查)、`--version` (指定版本)、`--yes` (跳过确认)
- **项目配置升级保护机制**：全面增强 `ak47 upgrade` 命令的用户自定义文件保护
  - 自定义文件扫描：自动识别 `.ak47/` 中不在模板中的文件
  - 智能影响分析：检测自定义文件是否可能与新版本不兼容
  - 自动备份：升级前可选备份自定义文件到 `.ak47/backups/pre-upgrade-{timestamp}/`
  - 交互式冲突解决：检测到冲突时提供 3 种处理方式 (保留用户版本/使用模板/稍后手动合并)
  - 升级后提示：显示后续建议和待处理事项

### 优化

- **职责分离**：将版本检查功能从 `upgrade --check` 迁移到独立的 `update` 命令
  - `update` 专注 CLI 工具自身更新
  - `upgrade` 专注项目配置模板升级
- **冲突处理增强**：展示冲突文件的版本对比 (行数、内容预览)，帮助用户决策
- **升级预览增强**：在升级前展示完整计划，包括自定义文件列表和冲突提示

### 影响范围

- 所有用户可通过 `ak47 update` 一键更新 CLI 工具
- 项目配置升级时，用户的自定义 Agent/Skill/Rule 文件得到全面保护
- 现有项目可使用 `ak47 upgrade` 安全升级到最新版本

---

## [0.4.1] - 2026-05-06

### 新增

- **Git 工作流自动触发规则**：AGENTS.md 模板新增 3 条自动触发规则，确保 Git 工作流在关键阶段自动执行
  - 规则 1：开始新功能时自动创建分支（调用 using-git-worktrees Skill）
  - 规则 2：完成 Task 后自动提交（调用 verification-before-completion Skill）
  - 规则 3：功能完成后自动处理分支（调用 finishing-a-development-branch Skill）
- **完整工作流流程图**：在 AGENTS.md 中提供可视化的 Git 工作流决策点指引

### 优化

- **机制化保障**：将 Git 工作流决策点从“软规则”升级为“自动触发规则”，AI 在特定场景必须执行
- **模板字符串转义**：修复 init.ts 中模板字符串的反引号转义问题，确保编译通过

### 影响范围

- 所有通过 `ak47 init` 初始化的新项目将自动继承这套 Git 工作流规范
- 现有项目不受影响，可选择手动更新 AGENTS.md

---

## [0.4.0] - 2026-05-06

### 新增

- **Git Hooks 体系**：新增 commit-msg 和 pre-commit 钩子，实现零 token 消耗的代码质量检查
  - `commit-msg`：验证 Commit Message 是否符合 Conventional Commits 规范
  - `pre-commit`：检查敏感信息、调试代码、大文件等
  - `install.sh`：一键安装 Git Hooks 到项目
- **Git 工作流规范**：AGENTS.md 新增 3 条强制规则
  - 第 9 条：Git 分支策略（使用 using-git-worktrees Skill）
  - 第 10 条：完成开发分支（使用 finishing-a-development-branch Skill）
  - 第 11 条：Git 提交规范（双重保障：Git Hook + AGENTS.md）
- **自动安装**：`ak47 init` 时自动安装 Git Hooks 到项目
- **协同文档**：新增 `docs/guides/git-hooks-collaboration.md` 说明 Git Hook 与 Qoder Hook 的分工策略

### 优化

- **Token 消耗优化**：硬规则验证从 Qoder Hook 迁移到 Git Hook，节省约 75% token
- **Qoder Hook 清理**：删除不支持的 SessionStart 事件配置（Qoder 官方文档确认不支持）
- **错误提示优化**：Git Hooks 安装失败时提供明确的手动安装指引

### 技术决策

- **混合方案**：Git Hook（硬规则）+ Qoder Hook（智能检查）+ AGENTS.md（软性指导）
- **避免重复检查**：Git Hook 已拦截的规则，Qoder Hook 不再重复检查
- **零 token 消耗**：Commit Message 格式验证、敏感信息检测等完全由 Git Hook 处理

---

## [0.3.7] - 2026-05-06

### 新增

- **Superpowers 完整集成**：init 时自动安装 14 个 Superpowers Skills 到项目
- **Hooks 自动触发**：配置 SessionStart Hook（Claude Code），会话启动时自动加载 using-superpowers skill
- **AGENTS.md Skills 引用**：声明必须使用的 8 个核心 Skills 及使用场景

### 优化

- **Skills 自动复制**：从 research-projects/superpowers/skills/ 完整复制目录（SKILL.md + 配套文档 + scripts/）
- **复用现有架构**：使用 HookGenerator 和 QoderHookAdapter/ClaudeHookAdapter 生成平台特定配置
- **session-start 脚本**：自动复制到项目 Skills 目录，支持 Hooks 调用

### 技术决策

- **Qoder 不支持 SessionStart**：Qoder 只支持 5 个事件（UserPromptSubmit, PreToolUse, PostToolUse, PostToolUseFailure, Stop）
- **Claude Code 支持 SessionStart**：可在会话启动时注入 using-superpowers skill 内容
- **完整目录复制**：每个 Skill 复制整个目录结构，保持文件完整性

---

## [0.3.6] - 2026-05-06

### 新增

- **AGENTS.md 自动生成**：init 命令在项目根目录生成 AGENTS.md，列出所有可用 Agent 和 Skill，定义强制规则

### 优化

- **平台选择简化**：一个项目只绑定一个 AI 平台，移除多平台配置询问

---

## [0.3.5] - 2026-05-06

### 新增

- **安装脚本快速参数**：支持 `--yes/-y`、`--latest/-l`、`--master/-m`、`--version/-v` 参数，实现完全自动化安装
- **安装脚本自动清理**：自动检测并清理损坏的安装（symlink 指向临时目录）

### 修复

- **npm install -g git+https 不打包 dist**：改用 git clone + npm pack + npm install -g 方式，解决 dist 文件丢失问题
- **npm install -g . 创建指向临时目录的 symlink**：使用 npm pack 打包后安装，避免 symlink 断链
- **openspec init --tools 缺少参数**：未选择平台时使用 `--tools none`，避免空字符串导致失败
- **平台选择交互体验**：从 checkbox 改为 select 单选，符合用户'回车=选择当前选项'的认知习惯
- **安装完成后目录切换**：保存原始目录，安装完成后回到原目录，避免用户被切换到根目录
- **OpenSpec preinstall 脚本失败**：使用 `--ignore-scripts` 跳过脚本，然后手动安装 OpenSpec CLI
- **安装失败错误提示**：移除过时的 SSH key 配置提示

---

## [0.3.4] - 2026-05-06

### 修复

- **安装脚本改用 HTTPS**：移除 SSH 检测和选择逻辑，默认使用 HTTPS 连接，无需配置 SSH 密钥
- **版本检测 URL 修复**：`git ls-remote` 从 SSH 改为 HTTPS

---

## [0.3.3] - 2026-05-06

### 修复

- **安装脚本路径错误**：修正 install.sh 路径为 `/tmp/ak47-install/scripts/install.sh`
- **安装文档混乱**：清理所有错误的安装方式（curl raw URL、~/.ak47 路径、AI 工具安装等），只保留唯一正确的 git clone 方式

### 文档

- **README.md**：删除手动安装方式，只保留一键安装脚本
- **installation.md**：从 395 行精简到 77 行，删除所有过时的安装方式

---

## [0.3.2] - 2026-05-06

### 新增

- **平台配置文件生成**：init 流程现在会为选中的平台（Qoder/Claude Code）生成完整的 Agent 和 Skill 配置文件
  - Qoder 平台：`.qoder/agents/*.md`、`.qoder/skills/*/SKILL.md`
  - Claude Code 平台：`agents/*.md`、`skills/*/SKILL.md`
- **TDD Skill 默认启用**：新项目初始化时自动启用测试驱动开发技能（skill-test-driven-development），不再只是建议

### 修复

- **Qoder Hook 配置格式**：修正为符合官方文档的嵌套结构（matcher 外层 + hooks 内层数组）
- **平台支持精简**：移除 Cursor/Codex/Gemini/Windsurf 支持，仅保留 Qoder 和 Claude Code

### 变更

- **init 流程顺序调整**：先选择平台，再生成文件，确保平台信息能正确传递到文件生成阶段
- **plan 函数签名扩展**：添加 `selectedPlatforms` 可选参数，支持按平台生成配置文件

---

## [0.3.1] - 2026-05-06

### 变更

- **OpenSpec 升级为必要依赖**：从 `peerDependenciesMeta.optional` 移至 `dependencies`，安装 ak47 时自动全局安装 OpenSpec CLI
- **install.sh 增强**：安装 ak47 后自动安装 OpenSpec CLI，并在验证阶段显示 OpenSpec 版本
- **openspec-setup.ts 强化**：OpenSpec 安装/初始化失败时抛出异常阻断流程，而非静默继续

### 文档

- **README.md**：新增「必要依赖」章节，说明 OpenSpec 的作用和安装方式

---

## [0.3.0] - 2026-05-06

### 新增

- **init 初始化模式选择**：支持「当前目录作为项目根目录」或「在当前目录内新建项目」
- **init 始终提供 AI 平台选择**：不再依赖自动检测，用户可从 Qoder/Claude Code/Cursor/Codex 中手动选择

### 修复

- **init 与范式解耦**：init 全量初始化所有能力单元，移除 L1/L2/L3 范式选择（范式是 change 命令概念）
- **config.paradigm 改为可选**：init 时不设置范式，change 触发时由用户选择

---

## [0.2.2] - 2026-05-06

### 修复

- **安装前清理指引**：README 增加清理步骤，解决 npm link 残留导致的 ENOTDIR/EPERM 问题

---

## [0.2.1] - 2026-05-06

### 修复

- **安装断链修复**：移除 `prepack` 脚本，避免 `npm install -g` 时 `tsc` 重构建覆盖已提交的 `dist/` 文件
- **README 精简**：删除重复的安装说明，按命令实现状态分区展示

---

## [0.2.0] - 2026-05-03

### 概述

完整复用 Superpowers 能力体系，实现 Skills + Hooks + AGENTS.md 三位一体机制，增强计划执行进度展示。

### 新增功能

#### Skills 能力体系完整复用

- **完整目录化**：8 个核心 Skills 全部改为目录结构（从单文件改为 SKILL.md + README + 配套文档）
  - brainstorming（3 文件）
  - executing-plans（2 文件）- **新增进度展示机制**
  - requesting-code-review（3 文件）
  - subagent-driven-development（5 文件）
  - systematic-debugging（10 文件）- **最完整，含 8 个配套文档**
  - test-driven-development（3 文件）
  - writing-plans（3 文件）
  - writing-skills（5 文件）- **含 1150 行 Anthropic 最佳实践**

- **新增配套文档**（20 个）：
  - testing-anti-patterns.md（TDD 反模式）
  - root-cause-tracing.md（根因追踪）
  - condition-based-waiting.md（条件等待）
  - defense-in-depth.md（深度防御）
  - anthropic-best-practices.md（1150 行最佳实践）
  - persuasion-principles.md（说服原则）
  - testing-skills-with-subagents.md（Skill 测试）
  - 以及 13 个其他配套文档

#### 计划执行进度展示机制

- **executing-plans 增强**：
  - 添加完整进度清单展示规范
  - 状态符号：[ ] [→] [✓] [!]
  - 批次执行机制（每 3 个任务一批）
  - 任务完成报告模板
  - 批次完成报告模板
  - 最终完成总结模板

#### AI 行为控制机制

- **AGENTS.md**（287 行）：
  - 定义 8 个核心 Skills 的使用场景
  - 1% 强制使用规则
  - 进度展示规则（executing-plans）
  - 禁止行为清单（跳过 Skills、脑想配置等）

- **SessionStart Hook**：
  - 自动注入 Skills 上下文
  - 强制使用规则注入
  - 会话启动时自动告知 AI 能力体系

#### 文档真实性保障

- **documentation-authenticity.md** Skill：
  - 禁止脑想配置和 API
  - 三步验证机制（查阅官方文档 → 保存到 docs/research/ → 标注来源）
  - 平台无关验证（Browser、MCP、手动研究）

- **规则执行器**：
  - doc-must-cite-sources 规则
  - PostToolUse Hook 检查
  - 自动验证文档引用来源

### 改进

- 所有 Skills 与 Superpowers 完全同步
- 进度跟踪可视化（类似 Superpowers 的体验）
- AI 行为控制从“建议”升级为“强制”
- 文档质量大幅提升（从单文件到完整体系）

### 统计数据

- **Skills**: 7 → 8 个（新增 executing-plans）
- **配套文档**: 0 → 20 个
- **总文档量**: ~1,000 → ~5,740 行
- **规则文件**: 287 行 AGENTS.md
- **Hook 脚本**: 65 行 session-start

---

## [0.1.0] - 2026-05-03

### 概述

初始版本，完成核心 CLI 功能和 Phase 2 实现。支持通过 Git 链接安装，版本标签管理。

### 新增功能

#### 核心模块

- **Scanner 模块**：技术栈检测、项目结构分析、AI 平台探测、Git 协作分析、项目成熟度评估
- **Recommender 模块**：规则引擎驱动能力单元推荐，支持 L1/L2/L3 范式预设
- **Generator 模块**：基于 Mustache 模板引擎渲染，文件规划与快照管理
- **Orchestrator 模块**：流程编排与进度追踪，支持 L1/L2/L3 三级变更流程引导
- **Config-Manager 模块**：配置 CRUD、备份与验证，环境分层执行与多文件同步
- **Upgrader 模块**：SHA256 快照对比、三路 diff 引擎、5 种升级策略（keep/overwrite/merge/skip/ask）
- **Validator 模块**：项目配置验证与一致性检查
- **Flows 模块**：L1/L2/L3 变更流程定义与执行

#### CLI 命令

- `ak47 init` — 项目初始化，扫描项目结构并生成 AI 基础设施配置
- `ak47 change <L1|L2|L3>` — 启动三级变更流程（需求变更 / 技术实现 / 缺陷修复）
- `ak47 config <get|set|list|reset>` — 项目级配置管理
- `ak47 validate` — 验证项目配置完整性
- `ak47 upgrade` — 同步项目模板到 CLI 最新版本

#### 模板资产

- 14 个 Agent/Skill 模板资产，覆盖 Qoder + Claude Code 双平台
  - 8 个 Agent 模板：architect、config-maintainer、developer、knowledge-engineer、po、process-guardian、reviewer、scaffold-maintainer
  - 6 个 Skill 模板：anti-patterns、change-classification、entry-guard、experience-summarization、harness-design、knowledge-research

### 工程化

- TypeScript strict 模式 + ESM 模块系统
- ESLint v9 + Prettier 代码规范
- Vitest 测试框架，20+ 测试文件，162 个测试全部通过
- Zod v4 运行时类型验证
- 批量修改完整性检查机制（Anti-Patterns + Reviewer 双层防护）

### 架构决策

- CLI 工具采用直接运行 dist 脚本方式（不使用 npm link）
- CLI 是核心执行引擎，Skill 是自然语言入口
- 双层更新架构：`ak47 update`（工具级）+ `ak47 upgrade`（项目级）
- 能力单元 CLI 架构：`init` 全量生成 + `change` 唯一入口
- `config` 命令作用域为当前项目
- 第三方参考项目统一存放在 `research-projects/` 目录

### 文档

- 完整的安装指南 (INSTALL.md)
- 版本管理规范 (VERSIONING.md)
- 自动化安装验证脚本 (scripts/verify-install.sh)
- 依赖管理文档 (DEPENDENCIES.md)

### 安装方式

**Git 链接安装（推荐）**：
```bash
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.1.0
```

**本地开发安装**：
```bash
git clone https://github.com/andyxai/AgentKit47-Qoder.git
cd AgentKit47
npm install && npm run build
npm link
```

### 已知限制

- 尚未发布到 npm，仅支持 Git 链接安装
- OpenSpec 和 Superpowers 作为本地参考副本，非运行时依赖
- 部分高级功能仍在开发中

---

