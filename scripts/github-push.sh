#!/bin/bash
#
# github-push.sh — GitHub 项目自动提交并推送
#
# 由 AI 或用户一键执行，完成 git add / commit / push 全流程。
#
# 用法：
#   bash scripts/github-push.sh                        # 交互确认后推送
#   bash scripts/github-push.sh -m "更新说明"            # 指定提交信息
#   bash scripts/github-push.sh -m "更新说明" --yes     # 跳过确认直接推送
#

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

COMMIT_MSG=""
SKIP_CONFIRM=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--message)
            COMMIT_MSG="$2"
            shift 2
            ;;
        --yes|-y)
            SKIP_CONFIRM=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="chore: sync from upstream ($(date +%Y-%m-%d))"
fi

echo "========================================="
echo "  GitHub 项目自动推送"
echo "========================================="
echo ""
echo "仓库: ${REPO_DIR}"
echo "提交信息: ${COMMIT_MSG}"
echo ""

if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    echo "✓ 没有需要提交的变更"
    exit 0
fi

echo "待提交文件:"
git status --short
echo ""

if [ "$SKIP_CONFIRM" != true ]; then
    read -p "确认提交并推送? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "已取消"
        exit 0
    fi
fi

git add -A
git commit -m "$COMMIT_MSG"
echo "✓ 已提交"

git push origin main
echo "✓ 已推送到 origin/main"

echo ""
echo "========================================="
echo "  推送完成！"
echo "========================================="
