#!/usr/bin/env bash
# Qoder PreToolUse Hook — OpenSpec Artifacts 完整性检查
#
# 规则：在已启动 OpenSpec 流程的项目中，写代码前应确保必要 artifacts 齐全。
# 覆盖门控：G3 (proposal) / G4 (design) / G5 (specs) / G6 (tasks)
# 策略：阻断。缺失必要 artifact 时阻断代码写入，强制完成 OpenSpec 流程。
#
# 退出码约定：
#   0  放行（无违规）
#   1  阻断（缺失 artifact）
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

# 无 file_path（非写文件工具）→ 放行
[ -z "$FILE_PATH" ] && exit 0

# 只对源码扩展名检查
if ! printf '%s' "$FILE_PATH" | grep -Eq '\.(ts|tsx|js|jsx|py|go|java|rs|rb|php|cpp|c|h|hpp|cs|kt|swift)$'; then
  exit 0
fi

# 测试文件豁免
if printf '%s' "$FILE_PATH" | grep -Eq '\.(test|spec)\.'; then
  exit 0
fi

# 新项目豁免：无 openspec/changes/ 或为空
if [ ! -d "openspec/changes" ]; then
  exit 0
fi
if [ -z "$(ls -A openspec/changes 2>/dev/null)" ]; then
  exit 0
fi

# ── 找到活跃的 Change 目录（排除 archive/） ──
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

# ── 逐 artifact 检查 ──
MISSING_COUNT=0

check_artifact() {
  local artifact="$1"
  local gate="$2"
  local path="$ACTIVE_CHANGE$artifact"
  if [ ! -f "$path" ] && [ ! -d "$path" ]; then
    printf '❌ [%s] 缺失 %s：%s\n' "$gate" "$artifact" "$path" >&2
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
}
check_artifact_nonempty_dir() {
  local artifact="$1"
  local gate="$2"
  local path="$ACTIVE_CHANGE$artifact"
  if [ ! -d "$path" ] || [ -z "$(ls -A "$path" 2>/dev/null)" ]; then
    printf '❌ [%s] 缺失 %s：%s\n' "$gate" "$artifact" "$path" >&2
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
}

check_artifact "proposal.md" "G3"
check_artifact "design.md"   "G4"
check_artifact_nonempty_dir "specs/" "G5"
check_artifact "tasks.md"    "G6"

if [ "$MISSING_COUNT" -gt 0 ]; then
  printf '\n❌ Change「%s」缺少 %d 个必要 artifact，写入已阻断\n' \
    "$CHANGE_NAME" "$MISSING_COUNT" >&2
  printf '   必须先完成 OpenSpec 流程再写代码\n' >&2
  printf '   快速补齐：/opsx:continue %s\n' "$CHANGE_NAME" >&2
  exit 1
fi

exit 0
