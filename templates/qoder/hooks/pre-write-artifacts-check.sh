#!/usr/bin/env bash
# Qoder PreToolUse Hook — OpenSpec Artifacts 级联完整性检查
#
# 规则：根据写入目标类型检查所有前置 artifact，形成级联依赖链：
#         proposal.md → G1 (PRD)
#         design.md   → G1 + G3 (proposal)
#         specs/      → G1 + G3 + G4 (design)
#         tasks.md    → G1 + G3 + G4 + G5 (specs)
#         源码        → G1 + G3 + G4 + G5 + G6 (tasks)
# 覆盖门控：G1 (PRD) / G3 (proposal) / G4 (design) / G5 (specs) / G6 (tasks)
# 策略：阻断。缺失前置 artifact 时阻断写入，强制完成 OpenSpec 流程。
#
# 退出码约定：
#   0  放行（无违规）
#   1  阻断（缺失 artifact）
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

# 无 file_path（非写文件工具）→ 放行
[ -z "$FILE_PATH" ] && exit 0

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

# ── 判断写入目标类型 ──
IS_SOURCE=false
IS_PROPOSAL=false
IS_DESIGN=false
IS_SPECS=false
IS_TASKS=false

if printf '%s' "$FILE_PATH" | grep -Eq '\.(ts|tsx|js|jsx|py|go|java|rs|rb|php|cpp|c|h|hpp|cs|kt|swift)$'; then
  IS_SOURCE=true
elif printf '%s' "$FILE_PATH" | grep -qE 'openspec/changes/[^/]+/proposal\.md$'; then
  IS_PROPOSAL=true
elif printf '%s' "$FILE_PATH" | grep -qE 'openspec/changes/[^/]+/design\.md$'; then
  IS_DESIGN=true
elif printf '%s' "$FILE_PATH" | grep -qE 'openspec/changes/[^/]+/specs/'; then
  IS_SPECS=true
elif printf '%s' "$FILE_PATH" | grep -qE 'openspec/changes/[^/]+/tasks\.md$'; then
  IS_TASKS=true
fi

# 测试文件豁免（仅源码）
if [ "$IS_SOURCE" = true ]; then
  if printf '%s' "$FILE_PATH" | grep -Eq '\.(test|spec)\.'; then
    exit 0
  fi
fi

# 非源码且非 artifact → 放行
if [ "$IS_SOURCE" = false ] && [ "$IS_PROPOSAL" = false ] && [ "$IS_DESIGN" = false ] && [ "$IS_SPECS" = false ] && [ "$IS_TASKS" = false ]; then
  exit 0
fi

# ── 辅助函数 ──
MISSING_COUNT=0

check_artifact() {
  local artifact="$1"
  local gate="$2"
  local path="$ACTIVE_CHANGE$artifact"
  if [ ! -f "$path" ] && [ ! -d "$path" ]; then
    printf '❌ [%s] 缺失前置 artifact %s：%s\n' "$gate" "$artifact" "$path" >&2
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
}

check_nonempty_dir() {
  local artifact="$1"
  local gate="$2"
  local path="$ACTIVE_CHANGE$artifact"
  if [ ! -d "$path" ] || [ -z "$(ls -A "$path" 2>/dev/null)" ]; then
    printf '❌ [%s] 缺失前置 artifact %s：%s\n' "$gate" "$artifact" "$path" >&2
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
}

# 检查 PRD 是否已填充
check_prd() {
  local prd_file="docs/prd/vision.md"
  local missing=false
  if [ ! -f "$prd_file" ]; then
    missing=true
  elif [ ! -s "$prd_file" ]; then
    missing=true
  elif grep -qE '待填充|TBD|TODO' "$prd_file" 2>/dev/null; then
    missing=true
  fi
  if [ "$missing" = true ]; then
    printf '❌ [G1] 缺失前置文档：docs/prd/vision.md 为空或仍含占位内容\n' >&2
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
}

# ── 根据文件类型级联检查前置依赖 ──
if [ "$IS_SOURCE" = true ]; then
  # 写源码前检查全部 artifacts（含 PRD）
  check_prd
  check_artifact "proposal.md" "G3"
  check_artifact "design.md"   "G4"
  check_nonempty_dir "specs/" "G5"
  check_artifact "tasks.md"    "G6"
elif [ "$IS_PROPOSAL" = true ]; then
  # 写 proposal.md 前检查 PRD
  check_prd
elif [ "$IS_DESIGN" = true ]; then
  # 写 design.md 前检查 PRD 和 proposal.md
  check_prd
  check_artifact "proposal.md" "G3"
elif [ "$IS_SPECS" = true ]; then
  # 写 specs/ 前检查 PRD、proposal.md、design.md
  check_prd
  check_artifact "proposal.md" "G3"
  check_artifact "design.md"   "G4"
elif [ "$IS_TASKS" = true ]; then
  # 写 tasks.md 前检查 PRD、proposal.md、design.md、specs/
  check_prd
  check_artifact "proposal.md" "G3"
  check_artifact "design.md"   "G4"
  check_nonempty_dir "specs/" "G5"
fi

if [ "$MISSING_COUNT" -gt 0 ]; then
  printf '\n❌ Change「%s」缺少 %d 个前置 artifact，写入已阻断\n' \
    "$CHANGE_NAME" "$MISSING_COUNT" >&2
  printf '   必须先完成前置 artifact 再继续\n' >&2
  exit 1
fi

exit 0
