#!/bin/bash
# 安装 Git Hooks
# 
# 使用方式:
#   bash templates/git-hooks/install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GIT_HOOKS_DIR="${PROJECT_ROOT}/.git/hooks"

# 检查是否在 Git 仓库中
if [ ! -d "${PROJECT_ROOT}/.git" ]; then
  echo "❌ 错误: 当前目录不是 Git 仓库"
  exit 1
fi

echo "🔧 安装 Git Hooks..."

# 创建 .git/hooks 目录（如果不存在）
mkdir -p "$GIT_HOOKS_DIR"

# 安装 hooks
hooks_installed=0

for hook in commit-msg pre-commit; do
  src="${SCRIPT_DIR}/${hook}"
  dst="${GIT_HOOKS_DIR}/${hook}"
  
  if [ -f "$src" ]; then
    # 备份已存在的 hook
    if [ -f "$dst" ]; then
      backup="${dst}.backup.$(date +%Y%m%d%H%M%S)"
      echo "  ⚠️  备份已存在的 hook: $(basename "$dst") → $(basename "$backup")"
      cp "$dst" "$backup"
    fi
    
    # 安装新 hook
    cp "$src" "$dst"
    chmod +x "$dst"
    echo "  ✅ 安装: $(basename "$hook")"
    hooks_installed=$((hooks_installed + 1))
  fi
done

echo ""
echo "✅ Git Hooks 安装完成！"
echo "   已安装 $hooks_installed 个 hooks"
echo ""
echo "📋 已安装的 hooks:"
echo "  • commit-msg  - 验证 Commit Message 格式"
echo "  • pre-commit  - 代码质量检查（敏感信息、调试代码、大文件）"
echo ""
echo "💡 提示:"
echo "  • 这些 hooks 在 git commit 时自动执行"
echo "  • 不消耗 AI token，完全本地执行"
echo "  • 如需跳过: git commit --no-verify"
echo ""
