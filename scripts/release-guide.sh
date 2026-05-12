#!/bin/bash
#
# release-guide.sh — GitHub 项目语义化版本发布指南
#
# 给 GitHub 项目 AI 用的标准化发版脚本。
# AI 按顺序执行每一步，每步完成后确认再继续。
#
# 用法（AI 在 GitHub 项目目录下执行）：
#   bash scripts/release-guide.sh           # 交互式，AI 按提示操作
#   bash scripts/release-guide.sh --dry-run # 仅预览，不实际修改
#

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# ============================================================
# Step 0: 检查前置条件
# ============================================================

echo "========================================="
echo "  AK47 语义化版本发布指南"
echo "========================================="
echo ""
echo "当前目录: ${REPO_DIR}"
echo ""

CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
echo "📦 当前版本: v${CURRENT_VERSION}"
echo ""

# ============================================================
# Step 1: 确定新版本号
# ============================================================

echo "--- Step 1: 确定版本号 ---"
echo ""
echo "根据变更类型选择版本升级方式："
echo "  PATCH (x.x.N) — 文档修正、bug 修复、小调整"
echo "  MINOR (x.N.0) — 新功能、新 Skill/Agent、功能增强"
echo "  MAJOR (N.0.0) — 破坏性变更、架构重构"
echo ""

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

NEXT_PATCH="${MAJOR}.${MINOR}.$((PATCH + 1))"
NEXT_MINOR="${MAJOR}.$((MINOR + 1)).0"
NEXT_MAJOR="$((MAJOR + 1)).0.0"

echo "推荐升级："
echo "  1) PATCH → v${NEXT_PATCH}"
echo "  2) MINOR → v${NEXT_MINOR}"
echo "  3) MAJOR → v${NEXT_MAJOR}"
echo "  4) 自定义"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] 将使用 v${NEXT_PATCH}"
    NEW_VERSION="$NEXT_PATCH"
else
    read -p "请选择 [1-4] (默认 1): " choice
    choice="${choice:-1}"

    case $choice in
        1) NEW_VERSION="$NEXT_PATCH" ;;
        2) NEW_VERSION="$NEXT_MINOR" ;;
        3) NEW_VERSION="$NEXT_MAJOR" ;;
        4)
            read -p "输入版本号 (不含 v): " NEW_VERSION
            ;;
        *)
            echo "无效选择，使用默认 PATCH"
            NEW_VERSION="$NEXT_PATCH"
            ;;
    esac
fi

echo ""
echo "✅ 目标版本: v${NEW_VERSION}"
echo ""

# ============================================================
# Step 2: 收集变更说明
# ============================================================

echo "--- Step 2: 变更说明 ---"
echo ""
echo "请描述本次发布包含的变更（多行输入，空行结束）："
echo ""

CHANGES=""
if [ "$DRY_RUN" = true ]; then
    CHANGES="- 示例变更项"
else
    while IFS= read -r line; do
        [[ -z "$line" ]] && break
        CHANGES="${CHANGES}- ${line}"$'\n'
    done
fi

TODAY=$(date +%Y-%m-%d)

# ============================================================
# Step 3: 展示变更计划并确认
# ============================================================

echo ""
echo "--- 变更计划 ---"
echo ""
echo "  版本: v${CURRENT_VERSION} → v${NEW_VERSION}"
echo "  日期: ${TODAY}"
echo "  类型: $([[ "$NEW_VERSION" == *".0.0" ]] && echo "MAJOR" || ([[ "$NEW_VERSION" == *".0" ]] && echo "MINOR" || echo "PATCH"))"
echo ""
echo "  变更内容:"
echo "$CHANGES"
echo ""
echo "  将修改以下文件:"
echo "    • package.json        — version 字段"
echo "    • README.md           — version badge"
echo "    • CHANGELOG.md        — 新增版本条目"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] 跳过确认，不实际修改文件"
    exit 0
fi

read -p "确认执行以上变更? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

# ============================================================
# Step 4: 执行文件修改
# ============================================================

echo ""
echo "--- Step 4: 修改文件 ---"

# 4.1 package.json
echo ""
echo "→ 修改 package.json ..."
node -e "
    const fs = require('fs');
    const path = '${REPO_DIR}/package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf-8'));
    pkg.version = '${NEW_VERSION}';
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
    console.log('✓ package.json: ${CURRENT_VERSION} → ${NEW_VERSION}');
"

# 4.2 README.md badge
echo ""
echo "→ 修改 README.md version badge ..."

# 跨平台 sed -i 兼容
if [[ "$(uname)" == "Darwin" ]]; then
    SED_INPLACE=(-i '')
else
    SED_INPLACE=(-i)
fi

sed "${SED_INPLACE[@]}" "s|version-${CURRENT_VERSION}-|version-${NEW_VERSION}-|g" "${REPO_DIR}/README.md" 2>/dev/null && \
    echo "✓ README.md badge: ${CURRENT_VERSION} → ${NEW_VERSION}" || \
    echo "⚠ README.md badge 未找到匹配，请手动检查"

# 4.3 CHANGELOG.md
echo ""
echo "→ 修改 CHANGELOG.md ..."

# 检查是否已有该版本的条目
if grep -q "## \[${NEW_VERSION}\]" "${REPO_DIR}/CHANGELOG.md" 2>/dev/null; then
    echo "⚠ CHANGELOG.md 中已存在 [${NEW_VERSION}] 条目，跳过"
else
    CHANGELOG_ENTRY=$(cat <<CHANGELOG_EOF
## [${NEW_VERSION}] - ${TODAY}

$CHANGES
CHANGELOG_EOF
)

    # 在第一个 ## [ 行之前插入新条目
    awk -v entry="$CHANGELOG_ENTRY

" \
        'NR==1 {print; next}
         /^## \[/ && !inserted {print entry; inserted=1}
         {print}' \
        "${REPO_DIR}/CHANGELOG.md" > "${REPO_DIR}/CHANGELOG.md.tmp" && \
        mv "${REPO_DIR}/CHANGELOG.md.tmp" "${REPO_DIR}/CHANGELOG.md"

    echo "✓ CHANGELOG.md: 新增 [${NEW_VERSION}] 条目"
fi

# ============================================================
# Step 5: 运行测试
# ============================================================

echo ""
echo "--- Step 5: 运行测试 ---"
echo ""

if [ -f "${REPO_DIR}/package.json" ] && node -e "process.exit(require('${REPO_DIR}/package.json').scripts?.test ? 0 : 1)" 2>/dev/null; then
    echo "→ 运行 npm test ..."
    npm --prefix "$REPO_DIR" test 2>&1 || {
        echo ""
        echo "❌ 测试未通过，请修复后再发布"
        exit 1
    }
    echo "✓ 测试通过"
else
    echo "⚠ 未配置测试脚本，跳过"
fi

# ============================================================
# Step 6: Git 操作指南
# ============================================================

echo ""
echo "========================================="
echo "  Step 6: Git 提交与推送"
echo "========================================="
echo ""
echo "文件已修改完毕。请 AI 执行以下 git 命令完成发布："
echo ""

# 检测变更范围，生成合适的 commit type
VERSION_TYPE="$([[ "$NEW_VERSION" == *".0.0" ]] && echo "major" || ([[ "$NEW_VERSION" == *".0" ]] && echo "minor" || echo "patch"))"

echo "  # 1. 查看变更"
echo "  git diff --stat"
echo "  git diff"
echo ""
echo "  # 2. 暂存并提交"
echo "  git add package.json README.md CHANGELOG.md"
echo "  git commit -m \"chore(release): v${NEW_VERSION}\""
echo ""
echo "  # 3. 创建标签"
echo "  git tag -a v${NEW_VERSION} -m \"v${NEW_VERSION}\""
echo ""
echo "  # 4. 推送（含标签）"
echo "  git push origin main"
echo "  git push origin v${NEW_VERSION}"
echo ""
echo "  # 5. 验证"
echo "  echo \"Release v${NEW_VERSION} →\""
echo "  echo \"https://github.com/andyxai/AgentKit47-Qoder/releases/tag/v${NEW_VERSION}\""
echo ""

echo "========================================="
echo "  发布准备完成！"
echo "========================================="
echo ""
echo "📋 检查清单:"
echo "  [ ] package.json 版本号: ${NEW_VERSION}"
echo "  [ ] README.md badge: v${NEW_VERSION}"
echo "  [ ] CHANGELOG.md 新增 [${NEW_VERSION}] 条目"
echo "  [ ] 测试通过"
echo "  [ ] git commit + tag + push 完成"
echo ""
