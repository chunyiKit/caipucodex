# CaipuCodex

一个面向家庭场景的移动端优先菜谱与点菜应用，包含菜谱管理、点菜生成菜单、历史菜单、采购清单和 AI 配菜。

## 功能概览

- 首页：今日入口、AI 配菜、最近菜单、家常好菜
- 菜谱：列表、搜索筛选、详情、新建、编辑、删除
- 点菜：菜品浏览、数量控制、购物车面板、菜单预览
- 菜单：历史记录、保存菜单、采购清单复制
- AI：输入人数与偏好后生成推荐菜单

## 项目结构

- `/Users/chunyi/Documents/caipucodex/frontend` React + TypeScript + Vite 前端
- `/Users/chunyi/Documents/caipucodex/backend` FastAPI + SQLAlchemy + PostgreSQL/SQLite 后端
- `/Users/chunyi/Documents/caipucodex/docs/DEPLOY.md` 部署文档
- `/Users/chunyi/Documents/caipucodex/docs/UPGRADE.md` 升级文档

## 环境要求

- Node.js 24+
- Python 3.11+
- PostgreSQL 15+（开发测试也支持 SQLite）

## 快速开始

1. 复制环境变量：`cp /Users/chunyi/Documents/caipucodex/.env.example /Users/chunyi/Documents/caipucodex/.env`
2. 安装后端依赖：`pip install -r /Users/chunyi/Documents/caipucodex/backend/requirements.txt`
3. 安装前端依赖：`cd /Users/chunyi/Documents/caipucodex/frontend && npm install`
4. 初始化测试数据：`cd /Users/chunyi/Documents/caipucodex/backend && PYTHONPATH=. python scripts/seed_data.py`
5. 启动服务：后端 `cd /Users/chunyi/Documents/caipucodex/backend && PYTHONPATH=. uvicorn app.main:app --reload`，前端 `cd /Users/chunyi/Documents/caipucodex/frontend && npm run dev`

## 一键启停

- 一键启动：`cd /Users/chunyi/Documents/caipucodex && ./scripts/start.sh`
- 一键停止：`cd /Users/chunyi/Documents/caipucodex && ./scripts/stop.sh`
- 启动脚本会先自动执行数据库迁移，再后台启动后端和前端
- 运行日志目录：`/Users/chunyi/Documents/caipucodex/.run/logs`
- PID 文件目录：`/Users/chunyi/Documents/caipucodex/.run/pids`

### 启动前提

- 已存在 `/Users/chunyi/Documents/caipucodex/.env`
- 已安装后端依赖并创建虚拟环境：`/Users/chunyi/Documents/caipucodex/backend/.venv`
- 已安装前端依赖：`/Users/chunyi/Documents/caipucodex/frontend/node_modules`

## 默认访问地址

- 前端：[http://localhost:5173](http://localhost:5173)
- 后端：[http://127.0.0.1:8000](http://127.0.0.1:8000)
- 健康检查：[http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## 环境变量

- `VITE_API_BASE_URL` 前端 API 地址
- `DATABASE_URL` 数据库连接串
- `OPENAI_API_KEY` OpenAI 或兼容 API Key
- `OPENAI_BASE_URL` 兼容接口地址，可空
- `OPENAI_MODEL` 模型名
- `OPENAI_TIMEOUT_SECONDS` AI 请求超时秒数

## 测试

- 后端：`cd /Users/chunyi/Documents/caipucodex/backend && PYTHONPATH=. pytest`
- 前端：`cd /Users/chunyi/Documents/caipucodex/frontend && npm test`
