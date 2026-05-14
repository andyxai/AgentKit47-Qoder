#!/usr/bin/env bash
# Qoder PostToolUse Hook — TDD 测试存在性检查
#
# 规则：对代码文件（非测试）检查是否存在邻近 .test.<ext> 文件，缺失则记偏离。
# 策略：警告 + 结构化日志，不阻断。
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

[ -z "$FILE_PATH" ] && exit 0

# 只对常见代码文件生效（含配置文件，其同样需格式/可解析性验证）
if ! printf '%s' "$FILE_PATH" | grep -Eq '\.(ts|tsx|js|jsx|py|go|txt|yaml|yml|json|toml|cfg|ini|conf)$'; then
  exit 0
fi
# 测试文件豁免
if printf '%s' "$FILE_PATH" | grep -Eq '\.(test|spec)\.'; then
  exit 0
fi

# 推导测试文件路径（保留原扩展名）
TEST_FILE="$(printf '%s' "$FILE_PATH" | sed -E 's/\.(ts|tsx|js|jsx|py|go|txt|yaml|yml|json|toml|cfg|ini|conf)$/.test.\1/')"
if [ -f "$TEST_FILE" ]; then
  exit 0
fi
# 兼容 __tests__/ 目录惯例
DIR="$(dirname "$FILE_PATH")"
BASE="$(basename "$FILE_PATH")"
if [ -f "$DIR/__tests__/${BASE%.*}.test.${BASE##*.}" ]; then
  exit 0
fi

printf '⚠️  偏离 TDD：未找到测试文件 %s\n' "$TEST_FILE" >&2
printf '   建议遵循 RED → GREEN → REFACTOR\n' >&2

log_deviation() {
  LOG_DIR=".ak47"
  LOG_FILE="$LOG_DIR/deviations.log"
  [ -d "$LOG_DIR" ] || return 0

  # 按大小轮转（> 256KB 滚到月度文件）
  if [ -f "$LOG_FILE" ]; then
    SIZE_KB="$(wc -c < "$LOG_FILE" | awk '{print int($1/1024)}')"
    if [ "$SIZE_KB" -gt 256 ]; then
      mv "$LOG_FILE" "$LOG_DIR/deviations-$(date -u +%Y%m).log" 2>/dev/null || true
    fi
  fi

  # 完整 YAML 数组项（缩进正确，便于解析器消费）
  {
    printf -- '- timestamp: "%s"\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '  deviation: "代码文件未编写测试"\n'
    printf '  file: "%s"\n' "$FILE_PATH"
    printf '  rule_violated: "TDD 流程（RED → GREEN → REFACTOR）"\n'
    printf '  impact: "medium"\n'
    printf '  auto_logged: true\n'
  } >> "$LOG_FILE"

  printf '📝 已记录到 %s\n' "$LOG_FILE" >&2
}

log_deviation
exit 0
