## 目标
- 在不改变接口路径与调用方式的前提下，用 Supabase Storage 替换现有 TOS 上传，实现公网可访问的图片存储。

## 代码改动概览
- 引入依赖：在服务端新增 `@supabase/supabase-js`。
- 新增初始化文件：`server/lib/supabase.ts`（服务端客户端初始化，不暴露到前端）。
- 改造路由：在 `server/routes/fileUpload.ts` 中用 Supabase 的 `storage.upload` 与 URL 生成替换现有 TOS 上传逻辑，保留大小/类型校验与降级兜底。

## 具体实现步骤
1. 初始化 Supabase 客户端
- 新建 `server/lib/supabase.ts`：
  - 从环境读取：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_BUCKET`。
  - 使用 `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` 创建服务端客户端并导出。
  - 校验必填环境变量，缺失时抛错（与 `server/routes/fileUpload.ts:17-25` 的校验风格一致）。

2. 替换上传实现（`server/routes/fileUpload.ts`）
- 保留请求解析与校验：大小限制（10MB，`149-152`）、类型白名单（`155-159`）、`Buffer` 转换（`161-174`）。
- 将上传逻辑替换为：
  - 生成路径：`uploads/<uuid>-<timestamp>.<ext>`（复用现有 `uuid` 以避免冲突，见 `48-62`）。
  - `await supabase.storage.from(bucket).upload(uploadPath, buffer, { contentType: file.type })`。
  - 获取访问 URL：
    - 若 bucket 公开：`getPublicUrl(uploadPath)`。
    - 若 bucket 私有：`createSignedUrl(uploadPath, 有效期如 7 天)`。
  - 返回 `{ url }` 给客户端。
- 保留降级兜底（`216-237`），发生错误时返回临时 URL 并提示重试。

3. 环境变量
- 在部署平台（如 Vercel）设置：
  - `SUPABASE_URL`：项目 URL。
  - `SUPABASE_SERVICE_ROLE_KEY`：服务角色密钥（仅服务端使用，切勿暴露）。
  - `SUPABASE_BUCKET`：存储桶名（如 `images`）。
- 现有 `AIPA_API_DOMAIN/EXPO_PUBLIC_AIPA_API_DOMAIN` 保持不变，仅用于 API 域名；后续可以切到 Vercel 域名。

4. 安全与合规
- 服务角色密钥只存在于服务端环境变量；不在仓库与前端代码中使用或输出。
- 若需要前端直传，后续可改为：服务端生成一次性上传签名或使用匿名上传预设（不推荐在生产中长期使用）。

5. 验证
- 用 `curl`/Postman 上传一张图片：`POST /api/file-upload` 携带 `file`。
- 检查返回的 URL 在公网可访问；在前端页面完成一次上传-展示联调。

## 您需要做什么
- 在 Supabase 创建项目与 Storage bucket（建议命名 `images`）。
- 决定 bucket 策略：公开（简单）或私有+签名 URL（更安全）。
- 将 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_BUCKET` 填入部署平台的环境变量。

## 我来做什么（获批后）
- 安装并接入 `@supabase/supabase-js`，新增 `server/lib/supabase.ts`。
- 重写 `server/routes/fileUpload.ts` 的上传实现为 Supabase Storage，并保留兜底逻辑。
- 部署并验证公网访问；如需要，我会将 API 域名切到 Vercel 并同步前端的域名配置。

请确认以上实施计划，我将开始替换并完成联调。