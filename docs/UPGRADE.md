# UPGRADE

本文档适用于基于 Ubuntu 22.04 LTS 纯服务器部署的 CaipuCodex 线上升级，不依赖宝塔面板。

## 一、升级前原则

每次升级前至少备份以下内容：

- PostgreSQL 数据库
- `/srv/caipucodex/.env`
- `/srv/caipucodex/backend/uploads`
- 当前线上代码目录或 Git 提交号

推荐先在测试机验证，再升级生产环境。

## 二、升级前备份

### 1. 备份数据库

```bash
mkdir -p /srv/backup/caipucodex
pg_dump -h 127.0.0.1 -U caipu caipucodex > /srv/backup/caipucodex/caipucodex-$(date +%F-%H%M%S).sql
```

### 2. 备份环境变量与上传文件

```bash
cp /srv/caipucodex/.env /srv/backup/caipucodex/.env.$(date +%F-%H%M%S)
tar -czf /srv/backup/caipucodex/uploads-$(date +%F-%H%M%S).tar.gz /srv/caipucodex/backend/uploads
```

## 三、标准升级流程

假设代码目录为：

```text
/srv/caipucodex
```

### 1. 拉取最新代码

```bash
cd /srv/caipucodex
git pull
```

如果你不是通过 Git 部署，而是通过上传覆盖代码，请确保：

- `.env` 不被覆盖
- `backend/uploads` 不被误删
- Nginx 站点仍指向 `frontend/dist`

### 2. 更新后端依赖

```bash
cd /srv/caipucodex/backend
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. 重新构建前端

```bash
cd /srv/caipucodex/frontend
npm ci
npm run build
```

### 4. 执行数据库迁移

```bash
cd /srv/caipucodex/backend
source .venv/bin/activate
PYTHONPATH=. .venv/bin/alembic upgrade head
```

### 5. 重启后端服务

```bash
sudo systemctl restart caipucodex
sudo systemctl status caipucodex
```

### 6. 检查 Nginx

通常前端重新构建后 Nginx 不需要重启；
如果你修改了 Nginx 配置，再执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 四、升级后验证

先做接口健康检查：

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/categories
```

再做页面验证：

- 首页是否可正常打开
- 最近菜单、家常好菜是否正常渲染
- 菜谱列表/详情/编辑是否正常
- 点菜、菜单预览、历史菜单、采购清单是否正常
- 图片上传与访问是否正常
- AI 推荐是否能成功返回

如果线上域名已启用 HTTPS，也建议检查：

- `https://你的域名/`
- `https://你的域名/api/categories`

## 五、数据库迁移注意事项

### 1. 迁移文件位置

迁移文件目录：

```text
/srv/caipucodex/backend/alembic/versions
```

线上执行的是：

```bash
cd /srv/caipucodex/backend
PYTHONPATH=. .venv/bin/alembic upgrade head
```

### 2. 如果数据库已有表但没有 Alembic 版本记录

可先打版本标记：

```bash
cd /srv/caipucodex/backend
source .venv/bin/activate
PYTHONPATH=. .venv/bin/alembic stamp head
```

只应在你确认数据库结构与当前迁移版本一致时使用。

## 六、回滚方案

### 1. 代码回滚

```bash
cd /srv/caipucodex
git log --oneline
git checkout <上一个稳定提交或标签>
```

### 2. 恢复数据库

```bash
psql -h 127.0.0.1 -U caipu -d caipucodex < /srv/backup/caipucodex/你的备份文件.sql
```

### 3. 恢复上传文件和环境变量

```bash
cp /srv/backup/caipucodex/最新的.env备份 /srv/caipucodex/.env
tar -xzf /srv/backup/caipucodex/对应的uploads备份.tar.gz -C /
```

### 4. 重启服务并验证

```bash
sudo systemctl restart caipucodex
sudo systemctl status caipucodex
curl http://127.0.0.1:8000/health
```

再用浏览器验证首页和核心链路。

## 七、每次升级后的检查清单

- `.env` 是否新增或变更变量
- `frontend/dist` 是否成功重新构建
- PostgreSQL 是否可连接
- `backend/uploads` 权限是否正常
- 域名、HTTPS、Nginx 反向代理是否仍正确
- AI 的 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL` 是否仍符合预期
- 若改动涉及页面布局，至少手工检查首页、点菜、菜单预览、菜谱编辑四个关键页面

## 八、建议的升级策略

建议把升级分成三类：

- 小版本：仅前端样式或文案调整，可直接重建前端并重启后端
- 常规版本：包含后端接口或数据库迁移，按本文完整流程执行
- 高风险版本：涉及数据结构调整、AI 逻辑变更、上传逻辑变更，先在测试环境完成一次全流程演练
