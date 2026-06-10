# 社区菜园认领 MVP

前后端分离的全栈 MVP：地块列表 + 认领登记，基础 CRUD。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript + Mantine v7 |
| 后端 | Flask + SQLAlchemy + SQLite |
| 数据库 | `./backend/data/garden.db` |

## 目录结构

```
├── backend/          # Flask API（端口 7000）
├── frontend/         # React 前端（端口 7101）
└── README.md
```

## 启动方式

### 1. 后端（端口 7000）

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

首次启动会自动创建 `data/garden.db` 并写入 5 条 seed 数据。

### 2. 前端（端口 7101）

新开一个终端：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问：<http://localhost:7101>

## 功能说明

- **页面 1 · 地块列表**：Mantine Table 展示认领人、作物等字段；支持按认领人/作物筛选（zustand 持久筛选条件）；可删除记录
- **页面 2 · 认领登记**：Mantine Form 提交新认领，字段含地块编号、认领人、作物、认领日期、预计收获日

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plots` | 列表（支持 `claimer`、`crop` 查询参数） |
| GET | `/api/plots/:id` | 详情 |
| POST | `/api/plots` | 新增认领 |
| PUT | `/api/plots/:id` | 更新 |
| DELETE | `/api/plots/:id` | 删除 |

前端通过 Vite 代理将 `/api` 转发至 `http://localhost:7000`。
