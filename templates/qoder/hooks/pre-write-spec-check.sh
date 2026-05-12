#!/usr/bin/env bash
# Qoder PreToolUse Hook — Spec 存在性检查
#
# 规则：在已启动 OpenSpec 流程的项目中，写代码前应当有活跃的 Spec。
# 策略：警告不阻断（避免新项目开箱即挂）。阻塞式检查由 ak47 validate 统一执行。
#
# 退出码约定：
#   0  放行（含警告）
#   非 0  保留给未来强阻断需求，当前一律 0
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

# 新项目豁免：无 openspec/ 或 openspec/changes/ 不存在 / 为空
if [ ! -d "openspec/changes" ]; then
  exit 0
fi
if [ -z "$(ls -A openspec/changes 2>/dev/null)" ]; then
  exit 0
fi

# 有 changes/ 但无任何 spec.md → 仅警告
if ! ls openspec/changes/*/spec.md 1>/dev/null 2>&1; then
  printf '⚠️  强建议：openspec/changes/ 存在但缺少 spec.md\n' >&2
  printf '   建议执行：/opsx:propose 或 openspec propose\n' >&2
fi

exit 0
