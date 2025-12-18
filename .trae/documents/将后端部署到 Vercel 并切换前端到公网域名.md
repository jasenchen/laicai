## 目标
- 将当前项目推送到你提供的远程仓库 `https://github.com/jasenchen/laicai.git`，随后在 Vercel 导入并部署后端。

## 我将执行的推送步骤
- 在项目根目录运行以下命令（自动检测已有 Git 配置并兼容）：
  - 如果未初始化：
    - `git init`
  - 检查远程：
    - `git remote -v`（若已存在 `origin` 则执行 `git remote set-url origin https://github.com/jasenchen/laicai.git`）
    - 否则：`git remote add origin https://github.com/jasenchen/laicai.git`
  - 设置主分支：
    - `git branch -M main`
  - 提交与推送：
    - `git add .`
    - `git commit -m "initial import: laicai app & server"`
    - `git push -u origin main`
- 注意：若推送过程中提示 GitHub 认证（HTTPS 方式），你需要在提示中登录或使用系统已配置的凭据；我会在命令行中等待并继续。

## 推送后连接 Vercel
- 在 Vercel 创建新项目，选择仓库 `jasenchen/laicai` 导入。
- 在项目 Environment Variables 设置：`SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_BUCKET`。
- 完成构建后，我会将前端 `.env` 的 `EXPO_PUBLIC_AIPA_API_DOMAIN` 切到 Vercel 域名并进行端到端验证。

## 可选优化（推送后执行）
- 添加 `.gitignore`（如 `ios/Pods`, `node_modules`, 构建产物等）避免推送无关文件。
- 如需 Release 分支和标签，我可以按你的规范创建。

请确认，我将立即在本地执行推送命令并继续在 Vercel 导入。