# Productivity Skills

非代码工作流相关的 Skills，涵盖 Git 工作流、计划管理、并行执行等生产力工具。

---

## 📋 Skills 列表

| Skill | 描述 | 触发场景 |
|-------|------|---------|
| [ak47-skill-using-git-worktrees](ak47-skill-using-git-worktrees/SKILL.md) | Git 工作树 - 创建隔离的开发环境 | 开始新功能开发、执行实施计划 |
| [ak47-skill-finishing-a-development-branch](ak47-skill-finishing-a-development-branch/SKILL.md) | 完成开发分支 - 合并/PR/清理 | 实施完成、测试通过 |
| [superpowers-writing-plans](superpowers-writing-plans/SKILL.md) | 编写计划 - 多步骤任务规划 | 接触代码之前、复杂任务 |
| [superpowers-executing-plans](superpowers-executing-plans/SKILL.md) | 执行计划 - 按书面计划执行 | 有书面实施计划后 |
| [superpowers-dispatching-parallel-agents](superpowers-dispatching-parallel-agents/SKILL.md) | 并发代理 - 并行执行独立任务 | 2+ 独立任务、无共享状态 |
| [superpowers-subagent-driven-development](superpowers-subagent-driven-development/SKILL.md) | 子代理开发 - 分解和分发任务 | 实施计划中有独立任务 |

---

## 🎯 使用指南

### Git 工作流

```
开始新功能
  ↓
使用 Git Worktree (using-git-worktrees)
  ↓ 创建隔离分支
  ↓
编写计划 (writing-plans)
  ↓ 任务分解
  ↓
执行计划 (executing-plans)
  ↓ 展示进度、批次执行
  ↓
子代理开发 (subagent-driven-development) [可选]
  ↓ 并行独立任务
  ↓
完成分支 (finishing-a-development-branch)
  ↓ 合并/PR/清理
  ↓
集成完成 ✅
```

### 并行执行策略

当有 2+ 独立任务时：
1. 使用 `dispatching-parallel-agents` 分发任务
2. 每个任务独立执行，无共享状态
3. 所有任务完成后汇总结果

---

## 📚 参考资料

- [AGENTS.md](../../../../AGENTS.md) - AI 行为指令和 Skill 使用规范
- [Git Hooks 配置](../../../../templates/git-hooks/) - 自动化检查脚本
