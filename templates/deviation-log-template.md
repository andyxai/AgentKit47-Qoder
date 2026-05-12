# 偏离记录模板

## 偏离记录格式

每次偏离标准流程时，按以下格式记录到 `.ak47/deviations.log`：

```yaml
- timestamp: "ISO 8601 时间戳"
  session: "会话 ID（如果有）"
  deviation: "偏离行为描述"
  rule_violated: "违反的规则（如果有）"
  reason: "偏离原因"
  impact: "low|medium|high"
  user_approval: true|false
  alternatives_considered: "考虑过的替代方案（可选）"
  mitigation: "缓解措施（可选）"
```

## 示例记录

```yaml
- timestamp: "2025-05-03T10:30:00Z"
  session: "abc123"
  deviation: "跳过 requirements-grilling 直接写代码"
  rule_violated: "使用 requirements-grilling 开始创造性工作"
  reason: "用户要求快速实现简单功能（单行配置修改）"
  impact: "low"
  user_approval: true
  alternatives_considered: "快速 requirements-grilling（5 分钟）"
  mitigation: "后续补充设计文档"

- timestamp: "2025-05-03T11:15:00Z"
  session: "abc123"
  deviation: "没有写测试直接实现"
  rule_violated: "没有测试不得提交"
  reason: "第三方库 API 调用，难以编写单元测试"
  impact: "medium"
  user_approval: true
  alternatives_considered: "使用 mock 框架"
  mitigation: "添加集成测试覆盖"

- timestamp: "2025-05-03T14:20:00Z"
  session: "def456"
  deviation: "没有 Spec 就开始写代码"
  rule_violated: "没有 Spec 不得编写代码"
  reason: "紧急 bug 修复，用户要求立即处理"
  impact: "high"
  user_approval: true
  alternatives_considered: "快速创建 Spec（10 分钟）"
  mitigation: "修复后补写 Spec 文档"
```

## 偏离统计

定期审查偏离记录，识别流程改进机会：

```bash
# 查看最近的偏离
tail -n 50 .ak47/deviations.log

# 统计偏离影响级别分布
grep "impact:" .ak47/deviations.log | sort | uniq -c

# 查看高频偏离原因
grep "reason:" .ak47/deviations.log | sort | uniq -c | sort -rn | head -10
```

## 审查建议

每周或每个 sprint 审查一次偏离记录：

1. **高频偏离**：哪些规则经常被违反？是否需要调整？
2. **高影响偏离**：哪些偏离造成了实际问题？
3. **用户反馈**：用户是否认为某些规则过于严格？
4. **流程改进**：能否通过工具或自动化减少偏离？
