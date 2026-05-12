#!/bin/bash

# AgentKit47 一键安装脚本
# 自动引导用户安装最新稳定版本
#
# 仓库地址：
#   - 从 git clone 执行时自动检测当前仓库 origin
#   - 通过环境变量 AK47_REPO 覆盖
#   - 通过管道执行时使用下方默认值
#   - 如需 fork 后使用自己的仓库，只需改下方 REPO_URL 或设置 AK47_REPO 环境变量

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 解析命令行参数
INSTALL_TARGET=""
QUIET_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --latest|-l)
            INSTALL_TARGET="latest"
            shift
            ;;
        --master|-m)
            INSTALL_TARGET="master"
            shift
            ;;
        --version|-v)
            INSTALL_TARGET="$2"
            shift 2
            ;;
        --yes|-y)
            QUIET_MODE=true
            shift
            ;;
        --help|-h)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --latest, -l       安装最新稳定版（默认）"
            echo "  --master, -m       安装 master 分支"
            echo "  --version, -v VER  安装指定版本"
            echo "  --yes, -y          安静模式，跳过所有交互确认"
            echo "  --help, -h         显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  $0                  # 交互式安装最新版"
            echo "  $0 --yes            # 自动安装最新版"
            echo "  $0 -y -l            # 自动安装最新版（简写）"
            echo "  $0 -v v0.3.4        # 安装指定版本"
            exit 0
            ;;
        *)
            echo -e "${RED}✗ 未知参数: $1${NC}"
            echo "使用 --help 查看用法"
            exit 1
            ;;
    esac
done

echo ""
echo "========================================="
echo -e "${BLUE}AgentKit47 安装脚本${NC}"
echo "========================================="
echo ""

# 检查 Node.js
echo -n "检查 Node.js ... "
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ 已安装 $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ 未安装 Node.js${NC}"
    echo "请先安装 Node.js >= 20.19.0"
    echo "https://nodejs.org/"
    exit 1
fi

# 检查 npm
echo -n "检查 npm ... "
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ 已安装 $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ 未安装 npm${NC}"
    exit 1
fi

# 获取可用版本
echo ""
echo "-----------------------------------------"
echo "获取可用版本..."
echo "-----------------------------------------"

LATEST_TAG=$(git ls-remote --tags "$REPO_URL" 2>/dev/null | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*$' | sort -V | tail -1)

if [ -z "$LATEST_TAG" ]; then
    echo -e "${YELLOW}⚠ 无法获取远程标签，将安装默认分支最新代码${NC}"
    LATEST_TAG=""
else
    echo -e "${GREEN}✓ 最新稳定版: $LATEST_TAG${NC}"
fi

# 版本选择
if [ -z "$INSTALL_TARGET" ] || [ "$INSTALL_TARGET" = "latest" ]; then
    # 安静模式或默认：安装最新版
    if [ "$QUIET_MODE" = true ]; then
        INSTALL_TARGET="${LATEST_TAG:-}"
    else
        # 显示安装选项
        echo ""
        echo "-----------------------------------------"
        echo "选择安装方式:"
        echo "-----------------------------------------"
        if [ -n "$LATEST_TAG" ]; then
            echo "1) 安装最新稳定版 ($LATEST_TAG) - 推荐"
        else
            echo "1) 安装默认分支最新代码 - 推荐"
        fi
        echo "2) 安装 master 分支 (最新代码)"
        echo "3) 安装指定版本"
        echo "4) 退出"
        echo ""
        
        read -p "请选择 [1-4]: " choice
        
        case $choice in
            1)
                INSTALL_TARGET="${LATEST_TAG:-}"
                ;;
            2)
                INSTALL_TARGET="master"
                echo ""
                echo -e "${YELLOW}⚠ 警告: master 分支可能包含未测试的功能${NC}"
                read -p "确定继续? (y/N): " confirm
                if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                    echo "安装已取消"
                    exit 0
                fi
                ;;
            3)
                echo ""
                read -p "请输入版本号 (例: v0.3.4): " custom_version
                if [ -z "$custom_version" ]; then
                    echo -e "${RED}✗ 版本号不能为空${NC}"
                    exit 1
                fi
                INSTALL_TARGET="$custom_version"
                ;;
            4)
                echo "安装已取消"
                exit 0
                ;;
            *)
                echo -e "${RED}✗ 无效选择${NC}"
                exit 1
                ;;
        esac
    fi
elif [ "$INSTALL_TARGET" = "master" ]; then
    echo -e "${YELLOW}⚠ 安装 master 分支 (最新代码)${NC}"
else
    echo -e "${BLUE}安装指定版本: $INSTALL_TARGET${NC}"
fi

# ============================================================
# 仓库地址配置（自动检测 + 环境变量覆盖 + 默认值）
# ============================================================

# 1. 从当前脚本所在仓库自动检测 origin（git clone 执行时）
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$SCRIPT_DIR/.git/config" ]; then
    GIT_URL="$(git -C "$SCRIPT_DIR" remote get-url origin 2>/dev/null || echo "")"
    if [[ "$GIT_URL" == git@* ]]; then
        GIT_URL="https://$(echo "$GIT_URL" | sed 's|git@||;s|:|/|')"
    fi
fi

# 2. 优先级: 环境变量 > git 检测 > 默认值
REPO_URL="${AK47_REPO:-${GIT_URL:-https://github.com/andyxai/AgentKit47-Qoder.git}}"
# 去掉可能的 git+ 前缀（兼容旧格式）
REPO_URL="${REPO_URL#git+}"

# 执行安装
echo ""
echo "-----------------------------------------"
echo "开始安装..."
echo "-----------------------------------------"
echo ""

# 检查是否已安装或存在损坏的安装
NEEDS_CLEANUP=false

# 检查 1: ak47 命令是否存在
if command -v ak47 > /dev/null 2>&1; then
    CURRENT_VERSION=$(ak47 --version 2>/dev/null || echo "unknown")
    echo -e "${YELLOW}⚠ 检测到已安装版本: $CURRENT_VERSION${NC}"
    
    # 标准化版本号格式
    CURRENT_VERSION_NORM=$(echo "$CURRENT_VERSION" | sed 's/^v//')
    INSTALL_TARGET_NORM=$(echo "$INSTALL_TARGET" | sed 's/^v//')
    
    if [ "$CURRENT_VERSION_NORM" = "$INSTALL_TARGET_NORM" ]; then
        echo -e "${GREEN}✓ 已安装目标版本，无需重复安装${NC}"
        echo ""
        echo "如需重新安装，请运行："
        echo "  npm uninstall -g agentkit47"
        echo "  bash scripts/install.sh"
        exit 0
    fi
    
    NEEDS_CLEANUP=true
fi

# 检查 2: 是否存在损坏的 symlink（指向临时目录）
AK47_BIN=$(npm config get prefix)/bin/ak47
AK47_LIB=$(npm config get prefix)/lib/node_modules/agentkit47

if [ -L "$AK47_BIN" ] && readlink -f "$AK47_BIN" 2>/dev/null | grep -q "tmp\|cacache"; then
    echo -e "${YELLOW}⚠ 检测到损坏的安装（symlink 指向临时目录）${NC}"
    NEEDS_CLEANUP=true
fi

if [ -L "$AK47_LIB" ] && readlink -f "$AK47_LIB" 2>/dev/null | grep -q "tmp\|cacache"; then
    echo -e "${YELLOW}⚠ 检测到损坏的安装（模块指向临时目录）${NC}"
    NEEDS_CLEANUP=true
fi

# 自动清理
if [ "$NEEDS_CLEANUP" = true ]; then
    echo ""
    echo -e "${BLUE}清理旧版本/损坏的安装...${NC}"
    npm uninstall -g agentkit47 2>/dev/null || true
    rm -f "$AK47_BIN" 2>/dev/null || true
    rm -rf "$AK47_LIB" 2>/dev/null || true
    echo -e "${GREEN}✓ 清理完成${NC}"
fi

# 安装
echo ""
echo -e "${BLUE}克隆仓库并安装...${NC}"
echo ""

# 保存当前目录
ORIGINAL_DIR=$(pwd)

# 创建临时目录
INSTALL_DIR=$(mktemp -d)

echo "→ 克隆仓库到临时目录..."
if [ -n "$INSTALL_TARGET" ]; then
    if ! git clone --depth 1 --branch "$INSTALL_TARGET" "$REPO_URL" "$INSTALL_DIR" 2>/dev/null; then
        echo -e "${RED}✗ 克隆失败 (分支: $INSTALL_TARGET)${NC}"
        exit 1
    fi
else
    if ! git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null; then
        echo -e "${RED}✗ 克隆失败${NC}"
        exit 1
    fi
fi

cd "$INSTALL_DIR"

echo "→ 安装依赖..."
npm install --ignore-scripts >/dev/null 2>&1

echo "→ 编译 TypeScript..."
npm run build >/dev/null 2>&1

echo "→ 打包..."
PACKAGE_FILE=$(npm pack 2>/dev/null | tail -1)

echo "→ 全局安装..."
if npm install -g "$PACKAGE_FILE"; then
    # 清理临时文件
    rm -f "$PACKAGE_FILE"
    cd "$ORIGINAL_DIR"
    rm -rf "$INSTALL_DIR"
    echo ""
    echo -e "${BLUE}安装 OpenSpec CLI（必要依赖）...${NC}"
    npm install -g @fission-ai/openspec >/dev/null 2>&1
    
    echo ""
    echo "========================================="
    echo -e "${GREEN}✓ 安装成功！${NC}"
    echo "========================================="
    echo ""
    
    # 验证安装
    echo "验证安装..."
    if command -v ak47 > /dev/null 2>&1; then
        INSTALLED_VERSION=$(ak47 --version)
        echo -e "${GREEN}✓ ak47 版本: $INSTALLED_VERSION${NC}"
        
        if command -v openspec > /dev/null 2>&1; then
            OPENSPEC_VERSION=$(openspec --version 2>/dev/null || echo "未知")
            echo -e "${GREEN}✓ OpenSpec 版本: $OPENSPEC_VERSION${NC}"
        fi
        
        echo ""
        echo "下一步："
        echo "  1. 创建测试项目: mkdir test-project && cd test-project"
        echo "  2. 初始化项目:   ak47 init"
        echo "  3. 查看帮助:     ak47 --help"
    else
        echo -e "${YELLOW}⚠ ak47 命令未找到，可能需要重新打开终端${NC}"
    fi
else
    echo ""
    echo "========================================="
    echo -e "${RED}✗ 安装失败${NC}"
    echo "========================================="
    echo ""
    echo "可能的原因："
    echo "  1. 权限不足 - 尝试使用 sudo 或配置 npm 全局目录权限"
    echo "  2. 网络问题 - 检查网络连接"
    echo "  3. Node.js 版本过低 - 需要 Node.js >= 20.19.0"
    echo ""
    echo "详细安装指南: ${REPO_URL%.git}#%E5%AE%89%E8%A3%85"
    exit 1
fi
