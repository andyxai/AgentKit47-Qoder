#!/usr/bin/env bash
# Qoder PreToolUse Hook — 代码写入前 TDD Skill 加载检查
#
# 规则：编写代码/配置文件前，提醒 AI 确保已加载 TDD Skill。
# 策略：阻断。未加载 TDD Skill 且无测试文件时阻断代码写入。
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

[ -z "$FILE_PATH" ] && exit 0

# 只对代码/配置文件生效
if ! printf '%s' "$FILE_PATH" | grep -Eq '\.(ts|tsx|js|jsx|py|go|txt|yaml|yml|json|toml|cfg|ini|conf)$'; then
  exit 0
fi

# 测试文件豁免
if printf '%s' "$FILE_PATH" | grep -Eq '\.(test|spec)\.'; then
  exit 0
fi

# 检查邻近测试文件是否存在——若已有则说明 TDD 已执行，无需警告
DIR="$(dirname "$FILE_PATH")"
BASE="$(basename "$FILE_PATH")"
EXT="${BASE##*.}"
BASE_NAME="${BASE%.*}"
_TEST_FILE="${DIR}/${BASE_NAME}.test.${EXT}"
if [ -f "$_TEST_FILE" ]; then
  exit 0
fi
if [ -f "${DIR}/__tests__/${BASE_NAME}.test.${EXT}" ]; then
  exit 0
fi

# 会话级去重：用 PID 做 key，同一 shell 会话只提醒一次
MARKER_DIR="/tmp/ak47-tdd-reminder"
mkdir -p "$MARKER_DIR"
MARKER_FILE="${MARKER_DIR}/tdd-reminded-$$"
if [ -f "$MARKER_FILE" ]; then
  exit 0
fi
touch "$MARKER_FILE"

printf '❌ TDD-GATE: 即将写入代码文件 %s，写入已阻断\n' "$FILE_PATH" >&2
printf '   未发现已有测试文件，必须先加载 ak47-skill-test-driven-development\n' >&2
printf '   流程: RED（先写测试）→ GREEN（再写实现）→ REFACTOR\n' >&2
printf '   如确认无需 TDD，请记录偏离到 .ak47/deviations.log 并说明原因\n' >&2

exit 1
