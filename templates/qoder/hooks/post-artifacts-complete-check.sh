#!/usr/bin/env bash
# Qoder PostToolUse Hook — Artifacts 完整后触发 critical-review 提醒
#
# 规则：当 openspec/changes/<active>/ 下 proposal/design/specs/tasks 全部齐备时，
#       提醒 AI 必须执行 G7 critical-review 才能进入 apply 阶段。
# 覆盖门控：G7 (批判性审核)
# 策略：阻断。Artifacts 全齐后必须完成 critical-review 才能继续，禁止跳过。
set -eu

# ── 检查是否有活跃 Change ──
if [ ! -d "openspec/changes" ]; then
  exit 0
fi

ACTIVE_CHANGE=""
for d in openspec/changes/*/; do
  dirname="$(basename "$d")"
  if [ "$dirname" != "archive" ]; then
    ACTIVE_CHANGE="$d"
    break
  fi
done

if [ -z "$ACTIVE_CHANGE" ]; then
  exit 0
fi

CHANGE_NAME="$(basename "$ACTIVE_CHANGE")"

# ── 检查四件套是否齐全 ──
ALL_READY=true

check_exists() {
  local path="$1"
  if [ ! -f "$path" ] && [ ! -d "$path" ]; then
    ALL_READY=false
  fi
}
check_nonempty_dir() {
  local path="$1"
  if [ ! -d "$path" ] || [ -z "$(ls -A "$path" 2>/dev/null)" ]; then
    ALL_READY=false
  fi
}

check_exists "$ACTIVE_CHANGE/proposal.md"
check_exists "$ACTIVE_CHANGE/design.md"
check_nonempty_dir "$ACTIVE_CHANGE/specs/"
check_exists "$ACTIVE_CHANGE/tasks.md"

if [ "$ALL_READY" = true ]; then
  printf '\n❌ [G7] OpenSpec artifacts 已全部齐备！\n' >&2
  printf '   Change: %s\n' "$CHANGE_NAME" >&2
  printf '   ⚠️  必须先执行 critical-review 后才能 apply，操作已阻断\n' >&2
  printf '   → 加载 ak47-skill-critical-review 或委托 ak47-agent-reviewer\n' >&2
  exit 1
fi

exit 0
