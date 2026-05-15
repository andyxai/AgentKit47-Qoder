#!/usr/bin/env bash
# Qoder PreToolUse Hook — OpenSpec Create Proposal 前 PRD 填充检查
#
# 规则：创建 proposal.md 前，检查 docs/prd/vision.md 是否已完成填充。
# 覆盖门控：G1 (需求理解确认) 的硬性兜底
# 策略：阻断。PRD 未完成填充时阻断 proposal 创建，强制先完成需求沉淀。
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

# 无 file_path → 放行
[ -z "$FILE_PATH" ] && exit 0

# 只对 proposal.md 生效
if ! printf '%s' "$FILE_PATH" | grep -qE 'openspec/changes/[^/]+/proposal\.md$'; then
  exit 0
fi

# ── 检查 PRD 是否已填充 ──
PRD_EMPTY=false

# 检查 vision.md
if [ -f "docs/prd/vision.md" ]; then
  # 检查文件是否为空或只包含占位内容
  if [ ! -s "docs/prd/vision.md" ]; then
    PRD_EMPTY=true
  elif grep -qE '待填充|TBD|TODO' "docs/prd/vision.md" 2>/dev/null; then
    PRD_EMPTY=true
  fi
else
  PRD_EMPTY=true
fi

if [ "$PRD_EMPTY" = true ]; then
  printf '\n❌ [G1] PRD 文档未完成填充，proposal 创建已阻断！\n' >&2
  printf '   docs/prd/vision.md 为空或仍含占位内容。\n' >&2
  printf '   \n' >&2
  printf '   按 core-behavior.md "新项目首次使用必须盘问" 规则：\n' >&2
  printf '   → 必须先完成需求盘问并将结果沉淀到 docs/prd/vision.md\n' >&2
  printf '   → 用户确认需求理解正确后，再创建 proposal\n' >&2
  printf '   \n' >&2
  printf '   🚫 禁止跳过需求沉淀直接创建 proposal\n' >&2
  exit 1
fi

exit 0
