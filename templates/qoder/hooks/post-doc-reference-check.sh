#!/usr/bin/env bash
# Qoder PostToolUse Hook — 文档引用来源检查
#
# 规则：新建/修改 .md 文档应标注官方引用或 docs/research/ 依据（禁止臆想）。
# 策略：阻断。缺失引用来源时阻断写入，元文档与用户经验文档豁免。
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

[ -z "$FILE_PATH" ] && exit 0
printf '%s' "$FILE_PATH" | grep -Eq '\.md$' || exit 0
[ -f "$FILE_PATH" ] || exit 0

# 元文档豁免
case "$(basename "$FILE_PATH")" in
  README.md|LICENSE.md|CHANGELOG.md|CONTRIBUTING.md|CONTEXT.md|AGENTS.md|SKILL.md)
    exit 0 ;;
esac

# 用户经验/模板路径豁免
if printf '%s' "$FILE_PATH" | grep -Eq '(^|/)(\.ak47|openspec|\.qoder)/'; then
  exit 0
fi

HAS_RESEARCH="$(grep -c 'docs/research/' "$FILE_PATH" 2>/dev/null || true)"
HAS_URL="$(grep -cE 'https?://[^ )]+' "$FILE_PATH" 2>/dev/null || true)"
HAS_RESEARCH="${HAS_RESEARCH:-0}"
HAS_URL="${HAS_URL:-0}"

if [ "$HAS_RESEARCH" = "0" ] && [ "$HAS_URL" = "0" ]; then
  printf '❌ 文档缺少引用来源：%s，写入已阻断\n' "$FILE_PATH" >&2
  printf '   必须标注 docs/research/<topic>.md 或官方文档 URL\n' >&2

  LOG_DIR=".ak47"
  LOG_FILE="$LOG_DIR/deviations.log"
  if [ -d "$LOG_DIR" ]; then
    if [ -f "$LOG_FILE" ]; then
      SIZE_KB="$(wc -c < "$LOG_FILE" | awk '{print int($1/1024)}')"
      if [ "$SIZE_KB" -gt 256 ]; then
        mv "$LOG_FILE" "$LOG_DIR/deviations-$(date -u +%Y%m).log" 2>/dev/null || true
      fi
    fi
    {
      printf -- '- timestamp: "%s"\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      printf '  deviation: "文档未标注官方引用"\n'
      printf '  file: "%s"\n' "$FILE_PATH"
      printf '  rule_violated: "禁止臆想 API/配置"\n'
      printf '  impact: "high"\n'
      printf '  auto_logged: true\n'
    } >> "$LOG_FILE"
  fi
  exit 1
fi

exit 0
