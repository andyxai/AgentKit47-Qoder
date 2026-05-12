# AgentKit47 版本管理与发布规范

## 版本策略

采用 **语义化版本 (SemVer)**：`MAJOR.MINOR.PATCH`

- **MAJOR** (主版本号)：不兼容的 API 变更
- **MINOR** (次版本号)：向后兼容的功能新增
- **PATCH** (修订号)：向后兼容的问题修正

### 当前版本

```
v0.1.0 - 初始版本，核心 CLI 功能实现
```

## 版本标签规范

### Git Tag 命名

```
v{版本号}

示例：
v0.1.0    # 初始版本
v0.1.1    # Bug 修复
v0.2.0    # 新功能
v1.0.0    # 稳定版本
```

### Tag 创建流程

```bash
# 1. 更新 package.json 版本号
npm version patch  # 0.1.0 → 0.1.1
# 或
npm version minor  # 0.1.0 → 0.2.0
# 或
npm version major  # 0.1.0 → 1.0.0

# 2. 自动创建 git tag（npm version 会自动创建）
# 查看 tag
git tag -l

# 3. 推送 tag 到远程
git push origin v0.1.0
# 或推送所有 tag
git push --tags
```

## 安装方式与版本控制

### ⚠️ 重要：始终使用版本标签

```bash
# ✅ 推荐：安装指定版本（稳定）
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.1.0

# ❌ 不推荐：省略版本号（会安装 master 最新代码）
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git
```

**为什么不推荐省略版本号？**
- master 分支可能包含未测试的功能
- 团队成员可能安装到不同版本的代码
- 出问题后难以复现和定位
- 无法回退到已知稳定状态

### 1. 安装指定版本（推荐用于生产环境）

```bash
# 安装 v0.1.0
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.1.0

# 安装 v0.2.0
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.2.0
```

**优势**：
- ✅ 版本锁定，不会受到后续开发影响
- ✅ 可重现的安装结果
- ✅ 多人协作时保持一致

### 2. 安装最新稳定版本

```bash
# 安装 master 分支最新代码
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#master
```

**注意**：master 分支可能包含未发布的开发中功能

### 3. 安装特定分支（开发测试）

```bash
# 安装 develop 分支
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#develop

# 安装 feature 分支
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#feature/new-command
```

### 4. 安装特定 commit（精确定位）

```bash
# 安装指定 commit hash
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#abc1234
```

## 分支管理策略

### 分支结构

```
master          # 主分支，始终可发布，每个 commit 都有 tag
  └── develop   # 开发分支，日常开发
       ├── feature/*    # 功能分支
       ├── bugfix/*     # 修复分支
       └── release/*    # 发布准备分支
```

### 分支用途

| 分支 | 用途 | 稳定性 | 谁可以用 |
|------|------|--------|---------|
| `master` | 已发布版本 | 🟢 稳定 | 所有人 |
| `v*` tags | 版本标签 | 🟢 稳定 | **生产环境推荐** |
| `develop` | 开发中 | 🟡 测试中 | 开发者测试 |
| `feature/*` | 新功能 | 🔴 不稳定 | 功能开发者 |

### 发布流程

```bash
# 1. 在 develop 分支完成开发
git checkout develop
# ... 开发、测试 ...

# 2. 创建发布分支
git checkout -b release/v0.2.0

# 3. 最终测试和文档更新
npm run test:run
# 更新 CHANGELOG.md
# 更新 README.md

# 4. 合并到 master
git checkout master
git merge release/v0.2.0

# 5. 创建版本标签
npm version minor  # 创建 v0.2.0 tag

# 6. 推送
git push origin master
git push origin v0.2.0

# 7. 合并回 develop
git checkout develop
git merge master
git push origin develop
```

## 版本升级指南

### 查看当前安装版本

```bash
ak47 --version
```

### 查看可用版本

```bash
# 查看所有标签
git ls-remote --tags https://github.com/andyxai/AgentKit47-Qoder.git

# 或在 GitLab 页面查看 Releases
```

### 升级版本

```bash
# 卸载旧版本
npm uninstall -g agentkit47

# 安装新版本
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.2.0

# 验证
ak47 --version
```

### 版本回退

```bash
# 如果新版本有问题，回退到旧版本
npm uninstall -g agentkit47
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.1.0
```

## CHANGELOG 规范

### 文件格式

```markdown
# Changelog

## [0.2.0] - 2026-05-10

### Added
- 新增 `ak47 change` 命令
- 支持多平台配置同步

### Changed
- 优化 `ak47 init` 交互流程
- 改进错误提示信息

### Fixed
- 修复模板路径解析问题
- 修复配置文件写入错误

## [0.1.1] - 2026-05-05

### Fixed
- 修复 Node.js 20 兼容性问题
```

### 更新时机

每次发布新版本时更新 CHANGELOG.md

## 实际使用场景

### 场景 1：生产环境使用

```bash
# 使用稳定版本，不受开发影响
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.1.0
```

### 场景 2：参与测试新功能

```bash
# 安装 develop 分支测试最新功能
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#develop
```

### 场景 3：开发者日常开发

```bash
# 本地开发模式，修改代码立即生效
git clone https://github.com/andyxai/AgentKit47-Qoder.git
cd AgentKit47
npm install
npm run build
npm link
```

### 场景 4：团队协作开发

```bash
# 开发者 A 开发 feature-x
git checkout -b feature/feature-x
# 开发完成后推送

# 开发者 B 要测试 feature-x
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#feature/feature-x
```

## 版本号管理清单

### package.json

```json
{
  "name": "agentkit47",
  "version": "0.1.0"  // 每次发布前更新
}
```

### CHANGELOG.md

记录每个版本的变更

### Git Tags

每个发布版本创建标签

### 文档同步

- README.md 中的版本号
- INSTALL.md 中的示例版本
- 其他文档中的版本引用

## 最佳实践

### ✅ 推荐做法

1. **生产环境使用版本标签**
   ```bash
   npm install -g ...#v0.1.0  # ✅ 稳定
   ```

2. **开发测试使用分支**
   ```bash
   npm install -g ...#develop  # ✅ 测试新功能
   ```

3. **本地开发用 npm link**
   ```bash
   npm link  # ✅ 修改立即生效
   ```

4. **发布前充分测试**
   ```bash
   npm run test:run
   npm run lint
   # 在测试项目验证
   ```

### ❌ 避免做法

1. **生产环境使用 master**
   ```bash
   npm install -g ...#master  # ❌ 可能包含未测试代码
   ```

2. **跳过版本号更新**
   ```bash
   # ❌ 改了代码但不更新版本
   git commit -m "feat: ..."
   git push
   # 应该先 npm version
   ```

3. **不创建 tag**
   ```bash
   # ❌ 发布但不打标签
   # 应该 git tag v0.1.0
   ```

## 快速参考

### 发布新版本 Checklist

- [ ] 所有测试通过 (`npm run test:run`)
- [ ] Lint 通过 (`npm run lint`)
- [ ] 构建成功 (`npm run build`)
- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号 (`npm version patch/minor/major`)
- [ ] 创建 git tag (自动)
- [ ] 推送到远程 (`git push && git push --tags`)
- [ ] 在测试项目验证安装
- [ ] 更新文档中的版本号

### 常用命令

```bash
# 查看当前版本
ak47 --version
git tag -l

# 创建新版本
npm version patch

# 推送
git push origin master v0.1.1

# 安装指定版本
npm install -g git+ssh://https://github.com/andyxai/AgentKit47-Qoder.git#v0.1.1

# 查看安装路径
npm root -g
```
