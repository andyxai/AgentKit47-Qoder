#!/usr/bin/env bash
# Qoder PostToolUse Hook — tasks.md 完成后 Brief 生成检查
#
# 规则：tasks.md 全部完成且变更规模超过阈值时，强制提示生成 Agent Brief。
#       与 brief-skip-incident-report.md 中记录的 Brief 遗漏问题配套。
# 覆盖门控：G6.5 (Brief 生成检查)
# 策略：阻断。tasks 全部完成且满足阈值时，强制生成 Brief 后才能继续。
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

# 无 file_path → 放行
[ -z "$FILE_PATH" ] && exit 0

# 只对 tasks.md 生效
if ! printf '%s' "$FILE_PATH" | grep -qE 'openspec/changes/[^/]+/tasks\.md$'; then
  exit 0
fi

# 文件不存在（刚删除？）→ 放行
[ -f "$FILE_PATH" ] || exit 0

CHANGE_NAME="$(printf '%s' "$FILE_PATH" | sed -E 's|openspec/changes/([^/]+)/tasks\.md|\1|')"
CHANGE_DIR="$(dirname "$FILE_PATH")"

# ── 检查是否所有 tasks 都完成 ──
# 统计总 task 数和已完成 task 数
TOTAL_TASKS="$(grep -cE '^\s*- \[[ x]\]' "$FILE_PATH" 2>/dev/null || echo 0)"
COMPLETED_TASKS="$(grep -cE '^\s*- \[x\]' "$FILE_PATH" 2>/dev/null || echo 0)"

if [ "$TOTAL_TASKS" -eq 0 ] || [ "$COMPLETED_TASKS" -lt "$TOTAL_TASKS" ]; then
  exit 0
fi

# tasks 全部完成！

# ── 评估变更规模阈值 ──
MEETS_THRESHOLD=false

# 条件 1：task 数 > 10
if [ "$TOTAL_TASKS" -gt 10 ]; then
  MEETS_THRESHOLD=true
fi

# 条件 2：跨模块 ≥ 2（检查 tasks.md 中是否提到多个模块/目录）
# 简化检查：统计 tasks.md 中出现的 src/ 子目录种类
if [ -f "$FILE_PATH" ]; then
  MODULE_COUNT="$(grep -oE '(src|app|lib)/[a-zA-Z0-9_-]+' "$FILE_PATH" 2>/dev/null | sort -u | wc -l | tr -d ' ')"
  if [ "${MODULE_COUNT:-0}" -ge 2 ]; then
    MEETS_THRESHOLD=true
  fi
fi

# 条件 3：文件数 > 3（检查 tasks.md 中提到的文件数）
if [ -f "$FILE_PATH" ]; then
  FILE_REF_COUNT="$(grep -cE '\.[a-z]{2,4}`' "$FILE_PATH" 2>/dev/null || echo 0)"
  if [ "${FILE_REF_COUNT:-0}" -gt 3 ]; then
    MEETS_THRESHOLD=true
  fi
fi

# 条件 4：是否已存在 brief.md
BRIEF_EXISTS=false
if [ -f ".ak47/briefs/${CHANGE_NAME}.md" ]; then
  BRIEF_EXISTS=true
fi

if [ "$MEETS_THRESHOLD" = true ] && [ "$BRIEF_EXISTS" = false ]; then
  printf '\n❌ [G6.5] tasks 全部完成，变更规模超过阈值，操作已阻断！\n' >&2
  printf '   Change: %s\n' "$CHANGE_NAME" >&2
  printf '   Tasks: %d/%d 已完成\n' "$COMPLETED_TASKS" "$TOTAL_TASKS" >&2
  printf '   \n' >&2
  printf '   评估指标:\n' >&2
  [ "$TOTAL_TASKS" -gt 10 ] && printf '     ✅ task 数 > 10（%d tasks）\n' "$TOTAL_TASKS" >&2
  [ "${MODULE_COUNT:-0}" -ge 2 ] && printf '     ✅ 跨模块 ≥ 2（%s 个模块）\n' "${MODULE_COUNT:-0}" >&2
  [ "${FILE_REF_COUNT:-0}" -gt 3 ] && printf '     ✅ 文件数 > 3（%s 个文件引用）\n' "${FILE_REF_COUNT:-0}" >&2
  printf '   \n' >&2
  printf '   ⚠️  当前变更符合 Agent Brief 生成条件，必须先完成 Brief。\n' >&2
  printf '   \n' >&2
  printf '   必须操作:\n' >&2
  printf '     1. 调用 ak47-skill-triage-brief 生成 Agent Brief\n' >&2
  printf '     2. Brief 生成后进入 critical-review (G7)\n' >&2
  printf '   \n' >&2
  printf '   🚫 禁止 AI 自行判断"不需要 Brief"直接跳过\n' >&2
  printf '   跳过需记录偏离到 .ak47/deviations.log 并获用户批准\n' >&2
  exit 1
fi

exit 0
