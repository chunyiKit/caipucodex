# DEPLOY

## 目标环境

本文档用于将 CaipuCodex 部署到纯 Ubuntu 22.04 LTS 云服务器，不使用宝塔面板。

推荐部署形态：

- 操作系统：Ubuntu 22.04 LTS
- Web 服务：Nginx
- 前端：Vite 构建后的静态文件
- 后端：FastAPI + Uvicorn，由 systemd 托管
- 数据库：PostgreSQL 15+
- 访问方式：直接通过服务器公网 IP 的 `80` 端口访问

推荐资源：

- 试运行：2 vCPU / 4 GB RAM / 60 GB SSD
- 正式使用：4 vCPU / 8 GB RAM / 80 GB SSD

## 一、服务器初始化

### 1. 基础准备

完成以下操作：

- 购买一台 Ubuntu 22.04 LTS 云服务器
- 绑定公网 IP
- 记录服务器公网 IP，例如 `1.2.3.4`
- 放通安全组端口：`22`、`80`

如果服务器启用了 UFW，可执行：

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw reload
```

### 2. 安装基础工具

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl wget unzip tar build-essential software-properties-common ca-certificates gnupg lsb-release nginx
```

## 二、项目目录规划

建议统一部署到：

```text
/srv/caipucodex
```

建议目录结构：

```text
/srv/caipucodex
├── backend
├── frontend
├── docs
├── scripts
├── .env
├── .env.example
└── backend/uploads
```

如果你是通过 Git 部署：

```bash
cd /srv
sudo git clone <你的仓库地址> caipucodex
cd /srv/caipucodex
```

如果你是本地上传代码，也建议保持相同目录结构。

建议创建专用运行用户：

```bash
sudo useradd -r -s /usr/sbin/nologin caipucodex || true
sudo chown -R $USER:$USER /srv/caipucodex
```

如果后续要让 systemd 以 `caipucodex` 用户运行，再按需调整属主。

## 三、安装运行时环境

### 1. Python 3.11

Ubuntu 22.04 默认是 Python 3.10，建议为本项目安装 Python 3.11。

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
```

确认版本：

```bash
python3.11 --version
```

### 2. Node.js

前端需要 Node.js 用于安装依赖和构建。

建议安装 Node.js 24 或当前 LTS 版本，确认版本：

```bash
node -v
npm -v
```

如果系统中尚未安装 Node.js，可使用 NodeSource 或 `nvm` 安装；只要保证能运行 `npm ci` 和 `npm run build` 即可。

### 3. PostgreSQL

若使用系统包安装：

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

创建数据库与用户：

```bash
sudo -u postgres psql
```

在 `psql` 中执行：

```sql
CREATE USER caipu WITH PASSWORD '请替换成强密码';
CREATE DATABASE caipucodex OWNER caipu;
GRANT ALL PRIVILEGES ON DATABASE caipucodex TO caipu;
\q
```

如需确认 PostgreSQL 版本：

```bash
psql --version
```

## 四、配置环境变量

复制环境变量模板：

```bash
cd /srv/caipucodex
cp .env.example .env
```

生产环境建议修改为：

```env
VITE_API_BASE_URL=

APP_NAME=CaipuCodex API
APP_ENV=production
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGIN=http://1.2.3.4
DATABASE_URL=postgresql+psycopg://caipu:强密码@127.0.0.1:5432/caipucodex
OPENAI_API_KEY=你的APIKey
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_SECONDS=30
```

注意：

- `VITE_API_BASE_URL` 这里留空，前端会直接使用同源的 `/api` 和 `/uploads`
- `APP_HOST` 建议为 `127.0.0.1`，由 Nginx 反向代理暴露
- `FRONTEND_ORIGIN` 必须改成你的公网 IP，例如 `http://1.2.3.4`
- 后端 `8000` 端口无需对公网开放，只需允许本机 `127.0.0.1` 访问
- `.env` 不要提交到 Git

## 五、安装依赖与初始化

### 1. 后端虚拟环境

```bash
cd /srv/caipucodex/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. 前端依赖与构建

```bash
cd /srv/caipucodex/frontend
npm ci
npm run build
```

构建产物在：

```text
/srv/caipucodex/frontend/dist
```

### 3. 数据库迁移

```bash
cd /srv/caipucodex/backend
source .venv/bin/activate
PYTHONPATH=. python -m alembic upgrade head
```

如果你的 PostgreSQL 已经存在表结构，但缺少 Alembic 版本记录，可执行：

```bash
cd /srv/caipucodex/backend
source .venv/bin/activate
PYTHONPATH=. python -m alembic stamp head
```

### 4. 初始化示例数据（可选）

只在首发演示或测试环境执行：

```bash
cd /srv/caipucodex/backend
source .venv/bin/activate
PYTHONPATH=. python scripts/seed_data.py
```

生产环境如果已经有真实数据，不要重复执行种子脚本。

## 六、配置后端常驻运行

推荐使用 systemd 托管后端。

创建服务文件：

```bash
sudo tee /etc/systemd/system/caipucodex.service >/dev/null <<'SYSTEMD'
[Unit]
Description=CaipuCodex API
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/srv/caipucodex/backend
EnvironmentFile=/srv/caipucodex/.env
Environment=PYTHONPATH=.
ExecStart=/srv/caipucodex/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3
User=root
Group=root

[Install]
WantedBy=multi-user.target
SYSTEMD
```

然后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable caipucodex
sudo systemctl start caipucodex
sudo systemctl status caipucodex
```

健康检查：

```bash
curl http://127.0.0.1:8000/health
```

说明：

- 文档示例使用 `root` 运行是为了降低首次部署复杂度
- 更稳妥的生产做法是创建单独用户并赋予目录权限，再将 `User` / `Group` 改为专用用户

## 七、配置前端站点与反向代理

### 1. Nginx 站点配置

创建站点配置：

```bash
sudo tee /etc/nginx/sites-available/caipucodex >/dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    root /srv/caipucodex/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
```

说明：

- `server_name _;` 表示该站点直接响应服务器公网 IP 的访问请求
- 浏览器访问地址为 `http://你的公网IP`
- 后端服务继续只监听 `127.0.0.1:8000`，由 Nginx 转发 `/api` 和 `/uploads`

启用站点：

```bash
sudo ln -sf /etc/nginx/sites-available/caipucodex /etc/nginx/sites-enabled/caipucodex
sudo nginx -t
sudo systemctl reload nginx
```

如果默认站点会冲突，可移除：

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 前端发布方式

前端每次更新后重新执行：

```bash
cd /srv/caipucodex/frontend
npm ci
npm run build
sudo systemctl reload nginx
```

Nginx 直接读取 `frontend/dist`，不需要额外前端进程。

## 八、HTTPS

当前文档使用的是公网 IP 直接访问，因此这一章可以跳过。

说明：

- Let's Encrypt 一般不能直接给裸公网 IP 签发证书
- 如果后续你绑定了正式域名，再安装 `certbot` 和 `python3-certbot-nginx`，并按下面方式启用 HTTPS

当你已经把域名解析到服务器后，可执行：

```bash
sudo certbot --nginx -d caipu.example.com
```

如果有多个域名，例如带 `www`：

```bash
sudo certbot --nginx -d caipu.example.com -d www.caipu.example.com
```

证书生效后，检查以下地址：

- `https://caipu.example.com`
- `https://caipu.example.com/api/categories`
- `https://caipu.example.com/uploads/...`

自动续期测试：

```bash
sudo certbot renew --dry-run
```

## 九、上传目录与权限

图片由后端以静态文件方式提供，务必保证上传目录可写。

建议检查：

```bash
mkdir -p /srv/caipucodex/backend/uploads
chmod -R 755 /srv/caipucodex/backend/uploads
```

如果你把 systemd 用户改成非 root，需要同步调整目录属主和权限。

## 十、部署后检查清单

按顺序验证：

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/categories
curl http://127.0.0.1
```

再检查服务状态：

```bash
sudo systemctl status caipucodex
sudo systemctl status nginx
sudo systemctl status postgresql
```

浏览器检查：

- `http://你的公网IP` 首页是否可访问
- 菜谱列表是否有数据
- 新建菜谱是否能上传图片
- 点菜 -> 生成菜单 -> 保存菜单链路是否正常
- 历史菜单和采购清单是否正常
- AI 推荐是否能返回结果

重点检查：

- Nginx 站点是否正确回退到 `index.html`
- `/api` 和 `/uploads` 是否已正确反向代理到后端
- `/api/` 是否正常反向代理
- `/uploads/` 图片是否能直接访问
- PostgreSQL 连接是否正常
- `.env` 中域名、数据库、AI 配置是否正确

## 十一、推荐的生产维护方式

线上建议采用如下组合：

- 代码目录：`/srv/caipucodex`
- 前端：每次升级重新执行 `npm run build`
- 后端：systemd 托管 `uvicorn`
- 数据库：PostgreSQL 本地服务或云数据库
- HTTPS：Certbot 自动续期
- 备份：数据库 + `.env` + `backend/uploads`

如果后续图片量上升，建议把图片从本地磁盘迁移到对象存储。
