#!/usr/bin/env bash
# Qoder PostToolUse Hook — 受控 Artifact 修改检测
#
# 规则：修改已审查通过的 openspec artifacts（proposal/design/tasks/specs/*/spec.md）后，
#       必须触发 critical-review 增量审查，禁止 AI 自行判断"改动小跳过审查"。
# 覆盖门控：G7 增量重审
# 策略：阻断。受控 Artifact 被修改后强制触发 critical-review，禁止 AI 自行放行。
set -eu

TOOL_INPUT="$(cat)"
FILE_PATH="$(printf '%s' "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

# 无 file_path → 放行
[ -z "$FILE_PATH" ] && exit 0

# ── 检查是否为受控 Artifact 路径 ──
# 匹配：openspec/changes/<change>/(proposal.md|design.md|tasks.md) 或 specs/**/spec.md
if ! printf '%s' "$FILE_PATH" | grep -qE 'openspec/changes/[^/]+/(proposal|design|tasks\.md)$|openspec/changes/[^/]+/specs/.+/spec\.md$'; then
  exit 0
fi

# ── 判断是新建还是修改已有文件 ──
# 受控 artifact 在写入时触发此 hook。如果文件已存在（修改），发出增量审查警告。
CHANGE_NAME="$(printf '%s' "$FILE_PATH" | sed -E 's|openspec/changes/([^/]+)/.*|\1|')"
ARTIFACT_NAME="$(printf '%s' "$FILE_PATH" | sed -E 's|openspec/changes/[^/]+/(.*)|\1|')"

printf '\n❌ [G7-RE] 受控 Artifact 被修改，写入已阻断！\n' >&2
printf '   Change: %s\n' "$CHANGE_NAME" >&2
printf '   文件: %s\n' "$ARTIFACT_NAME" >&2
printf '   ⚠️  该 artifact 已通过审查，修改后可能与其他 artifacts 不一致。\n' >&2
printf '   \n' >&2
printf '   必须操作:\n' >&2
printf '     1. 调用 ak47-skill-critical-review 对修改做增量审查\n' >&2
printf '     2. 审查结论需用户显式批准\n' >&2
printf '     3. 批准后继续 apply\n' >&2
printf '   \n' >&2
printf '   例外: 纯格式/typo 修复可申请跳过（需记录偏离到 .ak47/deviations.log）\n' >&2
printf '   🚫 禁止 AI 自行判断"改动小不需要审查"或自行扫描修复后直接放行\n' >&2

exit 1
