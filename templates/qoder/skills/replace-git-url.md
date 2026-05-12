---
name: replace-git-url
version: 1.0.0
description: "一键替换 AK47 项目中所有 Git 仓库地址，方便 Fork 后维护自己的版本"
---

# Replace Git URL

当用户克隆了 AK47 源码并想把它改成自己团队的仓库时，用这个 skill 一键替换所有 Git 地址依赖。

## 触发条件

用户说类似以下的话时触发：
- "帮我把 git 地址换成 XXX"
- "替换仓库地址为 XXX"
- "切换到我的仓库 XXX"
- "把所有 gitlab/github 地址改成 XXX"
- "/replace-git-url XXX"

## 执行流程

### 1. 获取新地址

从用户输入中提取新仓库地址。接受任意格式：
- `https://github.com/user/repo.git`
- `git@github.com:user/repo.git`
- `https://gitlab.com/user/repo.git`

如果用户没有提供完整地址，根据上下文推导（如提供 `user/repo`，拼上 `https://github.com/`）。

### 2. 地址归一化

从用户提供的地址推导三种形态：

```bash
# 示例输入: https://github.com/andyzx/AgentKit47-Github.git
NEW_REPO="https://github.com/andyzx/AgentKit47-Github.git"   # HTTPS repo
NEW_BASE="${NEW_REPO%.git}"                                    # https://github.com/andyzx/AgentKit47-Github
```

如果用户给的是 SSH 格式：`git@github.com:user/repo.git`，自动转为：
- NEW_REPO → `https://github.com/user/repo.git`
- NEW_BASE → `https://github.com/user/repo`

### 3. 替换文件

按以下顺序逐个文件修改：

#### 3.1 `package.json`

用 Node.js 精确修改 JSON 字段（不要用 sed 改 JSON）：

```javascript
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
pkg.repository = { type: 'git', url: '${NEW_REPO}' };
pkg.homepage = '${NEW_BASE}';
pkg.bugs = { url: '${NEW_BASE}/issues' };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
```

#### 3.2 `scripts/install.sh`

找到 fallback 默认地址那行（格式为 `:-默认地址}`），替换为新的：

```bash
sed -i '' "s|:-https://[^}]*}|:-${NEW_REPO}}|" scripts/install.sh
```

如果 install.sh 中还有其他残留的旧 git 地址（如注释中的示例），也一并替换。

#### 3.3 `scripts/sync-to-github.sh`（如果存在）

替换 `TARGET_REPO` 变量：

```bash
sed -i '' "s|TARGET_REPO=.*|TARGET_REPO=\"${NEW_REPO}\"|" scripts/sync-to-github.sh
sed -i '' "s|TARGET_DIR=.*|TARGET_DIR=\"\${HOME}/qoder/github/$(basename ${NEW_BASE})\"|" scripts/sync-to-github.sh
```

### 4. 验证

替换完成后，确认关键文件中的地址是否正确：

```bash
echo "=== package.json ==="
node -e "const p=require('./package.json'); console.log('repo:', p.repository.url); console.log('homepage:', p.homepage)"
echo ""
echo "=== install.sh 默认值 ==="
grep ":-.*}" scripts/install.sh | head -3
```

### 5. 输出摘要

向用户报告：
- 哪些文件被修改了
- 新的仓库地址是什么
- 提示用户可以 `git diff` 查看变更

## 注意事项

- `package.json` 用 Node.js 修改，不要用 sed（JSON 格式敏感）
- 只替换 Git 地址，不修改其他配置
- 修改完后提示用户检查变更并提交
- 如果用户想发布到 npm，提醒他们修改 `package.json` 的 `name` 字段避免冲突
