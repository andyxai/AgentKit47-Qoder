#!/usr/bin/env bash
# Qoder PostToolUse Hook — 完成前代码审查 + 测试覆盖校验
#
# 规则：在 Task 标记完成或执行 git commit 时，检查是否已执行代码审查和测试覆盖。
# 覆盖门控：G8 (代码审查) / G10 (功能验收)
# 策略：警告不阻断。AI 应按 core-behavior.md 的 Hook 警告响应规则加载对应 Skill。
set -eu

# ── 只对 Task 和 Bash 工具触发 ──
TOOL_INPUT="$(cat)"
TOOL_NAME="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)"

case "$TOOL_NAME" in
  Task|Bash) ;;
  *) exit 0 ;;
esac

# ── 对于 Bash：只关注 git commit 类命令 ──
if [ "$TOOL_NAME" = "Bash" ]; then
  CMD="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
  if ! printf '%s' "$CMD" | grep -qE 'git commit|git push'; then
    exit 0
  fi
fi

# ── 对于 Task：只关注完成动作 ──
if [ "$TOOL_NAME" = "Task" ]; then
  TASK_STATUS="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.status // empty' 2>/dev/null || true)"
  if [ "$TASK_STATUS" != "COMPLETE" ] && [ "$TASK_STATUS" != "complete" ]; then
    exit 0
  fi
fi

HAS_WARNING=false

# ── G8: 代码审查检查 ──
# 检查项目中是否存在最近审查记录（简化版：查找 review 相关文件）
HAS_REVIEW=false
if [ -d ".ak47" ]; then
  # 检查 deviations.log 中是否有 review 记录
  if [ -f ".ak47/deviations.log" ]; then
    if grep -q 'code.review\|code review\|审查' ".ak47/deviations.log" 2>/dev/null; then
      HAS_REVIEW=true
    fi
  fi
fi
# 也检查 openspec 下的 review 记录
if ls openspec/changes/*/review*.md 1>/dev/null 2>&1; then
  HAS_REVIEW=true
fi

if [ "$HAS_REVIEW" = false ]; then
  printf '⚠️  [G8] 未检测到代码审查记录。\n' >&2
  printf '   建议执行：加载 ak47-skill-code-review 或委托 ak47-agent-reviewer\n' >&2
  HAS_WARNING=true
fi

# ── G10: 测试覆盖检查 ──
# 检查是否有源码文件且无对应测试
SRC_COUNT=0
UNTESTED_COUNT=0

# 扫描常见源码目录
for dir in src/ lib/ app/; do
  if [ -d "$dir" ]; then
    while IFS= read -r srcfile; do
      SRC_COUNT=$((SRC_COUNT + 1))
      # 推导测试文件路径
      TESTFILE="${srcfile%.*}.test.${srcfile##*.}"
      # 也检查 __tests__/ 目录惯例
      TESTDIR="$(dirname "$srcfile")/__tests__"
      TESTFILE2="$TESTDIR/$(basename "${srcfile%.*}").test.${srcfile##*.}"
      if [ ! -f "$TESTFILE" ] && [ ! -f "$TESTFILE2" ]; then
        UNTESTED_COUNT=$((UNTESTED_COUNT + 1))
      fi
    done < <(find "$dir" -type f -name '*.ts' -o -name '*.py' -o -name '*.go' -o -name '*.js' 2>/dev/null | grep -vE '\.(test|spec)\.|/__tests__/|\.d\.ts$')
  fi
done

if [ "$SRC_COUNT" -gt 0 ] && [ "$UNTESTED_COUNT" -gt 0 ]; then
  # 如果未测试比例 > 30%，警告
  UNTESTED_PCT=$((UNTESTED_COUNT * 100 / SRC_COUNT))
  if [ "$UNTESTED_PCT" -gt 30 ]; then
    printf '⚠️  [G10] 测试覆盖率不足：%d/%d 源码文件无测试（%d%%）\n' \
      "$UNTESTED_COUNT" "$SRC_COUNT" "$UNTESTED_PCT" >&2
    printf '   建议遵循 TDD 流程补写测试后再提交。\n' >&2
    HAS_WARNING=true
  fi
fi

if [ "$HAS_WARNING" = true ]; then
  printf '\n📋 提交前请确保已完成代码审查和测试覆盖。\n' >&2
fi

exit 0
