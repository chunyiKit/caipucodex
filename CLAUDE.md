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

## 开发约定

- 前端开发服务器通过 Vite proxy 将 `/api` 和 `/uploads` 代理到 `http://127.0.0.1:8000`
- CSS 入口文件: `frontend/src/styles/index.css`
