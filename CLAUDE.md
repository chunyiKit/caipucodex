# CaipuCodex

家庭菜谱管理应用，帮助用户规划每日菜单、管理菜谱、AI 智能搭配。

## 项目结构

- `frontend/` — React 前端 (Vite + TypeScript)
- `backend/` — Python 后端 (FastAPI + SQLite + Alembic)

## 前端技术栈

- **构建工具**: Vite 6 + TypeScript
- **框架**: React 18
- **路由**: React Router v6
- **状态管理**: Zustand 5
- **数据请求**: TanStack React Query v5
- **UI 组件**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **动画**: Framer Motion + Lottie React
- **图标**: Lucide React
- **测试**: Vitest + Testing Library + Playwright

## 前端开发

```bash
cd frontend
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 生产构建
npm test           # 运行测试
```

### shadcn/ui 组件

添加组件：`npx shadcn@latest add <component>`

组件配置见 `frontend/components.json`，组件安装到 `frontend/src/components/ui/`。

### 路径别名

- `@/` → `frontend/src/`

## 后端开发

```bash
cd backend
pip install -r requirements.txt
# 数据库迁移使用 Alembic
```

## UI 设计规范

UI 设计参考 Airbnb 风格，详见 `DESIGN.md`。开发时须遵循以下核心要点：

### 色彩
- 背景: 纯白 `#ffffff`
- 主文本: 暖黑 `#222222`（禁用纯黑 `#000000`）
- 品牌强调色: Rausch Red `#ff385c`（仅用于主 CTA 和品牌元素）
- 次要文本: `#6a6a6a`
- 禁用态: `rgba(0,0,0,0.24)`

### 圆角
- 按钮: 8px
- 徽章: 14px
- 卡片/大按钮: 20px
- 大容器: 32px
- 导航控件/头像: 50%

### 阴影（三层叠加）
- 卡片: `rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px`
- 悬停: `rgba(0,0,0,0.08) 0px 4px 12px`

### 字体
- 使用 Inter 字体（项目已安装 `@fontsource-variable/inter`）
- 标题权重 500-700，禁用 300/400 细体
- 标题使用负字间距 (-0.18px ~ -0.44px)

### 间距
- 基准单位: 8px

## 开发约定

- 前端开发服务器通过 Vite proxy 将 `/api` 和 `/uploads` 代理到 `http://127.0.0.1:8000`
- CSS 入口文件: `frontend/src/styles/index.css`
