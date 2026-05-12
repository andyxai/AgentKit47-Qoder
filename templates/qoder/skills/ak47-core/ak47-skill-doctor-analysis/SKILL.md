---
name: ak47-skill-doctor-analysis
description: "ak47 项目健康体检分析 Skill。当用户说「体检」「项目健康度」「看看项目状态」或升级前后需要综合判断时加载。Skill 指示 Agent 编排 `ak47 doctor --json` + `git diff` 并输出可操作改进建议。"
---

# 项目健康体检分析 Skill

## 用途

将 `ak47 doctor` 产出的确定性证据与项目当前的本地修改（`git diff`）结合，产出针对本项目的可操作改进建议。

**职责分层**（遵循项目"CLI 与 LLM 职责分层"决策）：

| 层级 | 谁来做 | 输出 |
|------|--------|------|
| 证据收集 | `ak47 doctor --json`（TS 确定性） | 结构化健康快照 |
| 差异获取 | `git status` + `git diff`（Git 确定性） | 用户本地修改列表 |
| 综合解读 | Agent + 本 Skill（LLM 创造性） | 针对本项目的改进建议 |

## 触发条件

- 用户说"体检""项目健康度""看看项目现在怎么样""升级前先检查""升级后还有什么要处理"
- 主 Agent 在重量修改前需要摸清项目状态
- Reviewer Agent 审查时需要项目全貌背景

## 执行步骤

### 1. 采集证据（必须按顺序执行）

```bash
# 1.1 运行健康体检
ak47 doctor --json > /tmp/ak47-doctor.json

# 1.2 查询未提交的本地修改
git status --porcelain
git diff --stat
git diff --unified=3 -- '.ak47' '.qoder' 'AGENTS.md' 'package.json'
```

- 若 `ak47 doctor` 不可用（项目未初始化），直接回退到 `ak47 init` 引导。
- 若不在 git 仓库内，跳过 git 步骤，仅基于 doctor JSON 给建议。

### 2. 分析 JSON 结构

`DoctorReport` 顶层字段：

- `overall`: `pass` / `warn` / `fail`（对应整体健康度）
- `sections[]`: 6 个固定分区（环境/项目结构/快照一致性/升级待办/自定义资产/升级冲突残留）
- `summary`: pass/warn/fail 计数
- `meta`: 项目/CLI/Node 版本

每个 `check` 含：`id`、`title`、`severity`、`message`、可选 `hint` 与 `details`。

### 3. 解读与建议映射

对每个 **非 pass** 的 check，按照"根因 → 风险 → 具体动作"三段式给建议：

| check.id | 常见根因 | 推荐动作 |
|----------|----------|----------|
| `struct.ak47-dir` fail | 项目未初始化 | `ak47 init` |
| `struct.config` fail | 手改导致 YAML 损坏 | 从 `.ak47/backups/` 恢复或 `ak47 init --force` |
| `struct.snapshot` warn | 初始化后未升级过 | 可运行 `ak47 upgrade --dry-run` 建立基线 |
| `snapshot.missing` fail | 文件被误删 | 结合 `git log -- <path>` 判断是否恢复 |
| `snapshot.modified` warn | 用户有意定制 | 确认是定制还是遗忘 → 视情况沉淀到经验或回滚 |
| `upgrade.pending` warn | 模板更新了 | `ak47 upgrade --dry-run` 查看详情后决定 |
| `custom.qoder` pass | 用户有自定义 Agent/Skill | 提示纳入版本管理，不被 upgrade 覆盖 |
| `conflict.residue` warn | 上次升级未合并 .new | 逐个对比 `<path>` vs `<path>.new`，择优保留 |

### 4. 结合 `git diff` 做相关性判定

- 若 `snapshot.modified` 的文件**正在 `git diff` 中**：这是用户正在进行的定制，不用担心，提醒"记得提交"。
- 若 `snapshot.modified` 的文件**已 committed** 且偏离模板：提醒"下次 upgrade 会产生 .new 冲突"。
- 若 `conflict.residue` 的 `.new` 文件**未被任何 diff 覆盖**：用户确实忘了处理，优先建议合并。
- 若 `upgrade.pending` 的 add 项与 `git diff` 中的新功能相关：提醒用户 `ak47 upgrade` 后再继续开发，避免冲突。

### 5. 输出格式

严格按以下 Markdown 结构输出，便于用户快速扫读：

```markdown
## 🩺 项目体检结果

**整体**: {pass|warn|fail} ({summary})

### ❗ 需要立即处理
- {每项一行：严重度图标 + 问题描述 + 推荐命令}

### ⚠️  建议关注
- ...

### ✅ 一切正常
- ...

### 💡 结合本地修改的观察
- {基于 git diff 的针对性洞察}

### 🎯 推荐下一步
1. {最多 3 条 actionable 动作，按优先级排序}
```

## 关键红线

- ❌ 不得跳过 `ak47 doctor --json` 直接凭猜测给结论
- ❌ 不得编造 `check.id`（必须与 CLI 产出的真实 id 对应）
- ❌ 不得推荐 `rm -rf` 之类的不可逆命令
- ✅ 任何"文件缺失"建议必须先用 `git log` / `git show` 查历史
- ✅ 对 warn 级别不要过度告警，避免噪音疲劳

## 输出约束

- 长度控制在 40 行以内，突出 actionable
- 不重复 JSON 中的 `message`，只输出"在你本项目里意味着什么"
- 如 `overall=pass` 且无 `git diff`，一句话答复即可："体检通过，无待办"
