---
name: ak47-skill-entry-guard
description: "ak47 入口判定 Skill，判定用户请求属于答疑/轻量修改/重量修改"
---

# 入口判定 Skill

## 用途

主Agent每次收到用户输入时，先加载本 Skill 执行入口判定，区分答疑、轻量修改、重量修改。

## 判定规则

```
收到用户输入
    ├─ 纯答疑？（不涉及文件修改）→ 直接回答，结束
    ├─ 轻量修改？（版本号/typo/配置微调/加单测）→ 委托 Developer
    └─ 重量修改？（业务逻辑/新功能/架构调整）→ 加载 change-classification → L1/L2/L3
```

## 速查表

| 用户表述 | 判定 | 处理 |
|---------|------|------|
| "这个框架怎么用？" | 答疑 | 直接回答 |
| "更新版本号到 1.2.0" | 轻量修改 | 委托 Developer |
| "帮我改下登录逻辑" | 重量修改 | 分级 → 标准流程 |
| "review 这个 PR" | 委托 Reviewer | 启动 Reviewer |
| "沉淀经验" | 委托 KE | 启动 Knowledge Engineer |

## 输出格式

```yaml
classification: "答疑" | "轻量修改" | "重量修改"
reason: "判定理由（一句话）"
next_action: "直接回答 / 委托 ak47-agent-developer / 加载 change-classification"
```

## 关键红线

- ❌ 绝不可主Agent自己动手修改文件
- ❌ 禁止重量修改绕过 change-classification
- ❌ 禁止以"改动很小"为由跳过判定

## 与 change-classification 的分工

| | entry-guard | change-classification |
|---|---|---|
| 职责 | 判定是不是修改 | 把修改分到 L1/L2/L3 |
| 时机 | 任何输入的第一步 | entry-guard 判定为"重量修改"后 |
| 输出 | 答疑 / 轻量 / 重量 | L1 / L2 / L3 |

两者前后衔接，互不替代。
