# AgnesInsight Pro • 智能媒体识别与网页分析工作台

这是一个高可读、响应式、支持多模态智能分析的高水准 Web 应用程序。用户可以上传本地图片或添加网页链接（URL），通过内置的服务器端中转网关，直接调用配置好的 custom API (`agnes-2.0-flash`) 获得精准细致的识别分析、文字提取（OCR）与总结提炼报告。

---

## 🛠️ 技术栈 (Tech Stack)

### 前端开发 (Frontend)
- **React 19 + TypeScript**: 构建高度类型安全的单页面应用（SPA）
- **Vite 6**: 极速热更新与现代前端工程化打包构建
- **Tailwind CSS v4**: 实现极其精致、高对比度与响应式的“Professional Polish”界面设计
- **Lucide React**: 统一个性化的现代矢量图标库
- **Motion (motion/react)**: 实现轻量而细腻的平滑过渡与动画效果

### 后端网关 (Backend)
- **Express (Node.js)**: 搭建高效的安全服务端代理 API，避免泄露 API Key 到浏览器端
- **TSX**: 在开发环境中无缝、直接运行 TypeScript 服务端代码
- **esbuild**: 在构建打包时将服务端 TypeScript 编译压缩为单个独立的 `dist/server.cjs` 包，极速提升冷启动速度
- **dotenv**: 管理环境变量配置

---

## 🎯 主入口文件 (Main Entry Points)

- **前端主入口**: `/src/main.tsx` 与 `/src/App.tsx`（应用核心视图及业务交互）
- **后端服务主入口**: `/server.ts`（处理网页爬取分析 fallback、接收图片、组装消息及中转 API completions 请求）
- **类型定义主入口**: `/src/types.ts`（共享的 TS 数据模型与接口声明）
- **自定义 Markdown 渲染器**: `/src/components/MarkdownView.tsx`（纯手写高性能 Markdown 解析，支持多级标题、列表、代码块、加粗和内联代码展示，不依赖臃肿的三方库）

---

## 🚀 启动与构建命令 (Scripts & Commands)

在应用根目录下，您可以使用以下脚本完成开发与部署：

### 1. 安装项目依赖
```bash
npm install
```

### 2. 启动本地开发服务 (同时运行 Express 网关与 Vite)
```bash
npm run dev
```
此命令会通过 `tsx server.ts` 运行服务端，它将自动作为中间件托管 Vite 页面，您可通过浏览器访问：`http://localhost:3000`。

### 3. 全量构建 (Production Build)
```bash
npm run build
```
此命令会：
1. 编译前端静态资源，并将输出写入 `/dist`。
2. 使用 `esbuild` 将后端 `server.ts` 及其引用的文件打包成一个独立的 CJS 模块 `/dist/server.cjs`，该文件体积小、没有繁琐的 runtime ESM 相对路径校验。

### 4. 生产环境启动 (Production Start)
```bash
npm run start
```
直接使用 node 启动已经打包好的 CJS 服务包 `node dist/server.cjs`，无需任何额外的转译依赖。

---

## ⚙️ 环境变量配置 (.env)

应用后端依赖外部 API 服务进行智能分析。请确保项目根目录下存在 `.env` 文件，内容如下：

```env
# API 中转服务基础端点
BASE_URL="https://apihub.agnes-ai.com/v1"

# API 密钥（后台网关中转，确保安全，不暴露给前端浏览器）
API_KEY="我的秘钥"

# 使用的视觉/多模态推理模型名称
MODEL="agnes-2.0-flash"
```

*注：后端服务支持热重载读取此 `.env` 配置文件，每次发起分析时会自动拉取最新设置。*

---

## ✨ 核心特色功能

1. **双材料类型融合支持**：
   - **本地图片**：支持拖拽、点击上传图片（转为 Base64 传递给多模态大模型）。
   - **网页链接**：采用高性能后端正则爬虫抓取目标网页，清洗并精简掉无效 JS/CSS 后发送文本；如果网络处于隔离沙箱中，将自动无缝降级（Fallback）为结合域名和提示词的深度背景推导，保障系统绝对不会因报错而卡死。
2. **多套预设提示词 (Presets)**：内置 OCR 提取、深度分析、设计审美点评、要点归纳、社媒推广等多种高级专家提示词，一键切换。
3. **极速一键复制**：提供经过沙箱 iframe 兼容性加固的 Clipboard 复制结果功能，保障在任何环境均能轻松复用分析报告。
4. **精美暗黑/明亮双主题**：支持持久化保存本地习惯，整体设计严格遵循 Professional Polish 美学规范，高对比度，高端大气。
