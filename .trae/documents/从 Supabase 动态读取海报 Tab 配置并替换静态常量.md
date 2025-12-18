## 目标
- 将 `app/poster-generation.tsx` 中静态的 `TAB_CONFIGS` 与 `stylesList` 改为从 Supabase 表 `haibao-generation-tab` 动态读取。
- 使用表字段映射：
  - `num` → Tab 排序（升序）
  - `tab-pre` → Tab 预览图（StyleTabSelector 的 `image`）
  - `tab-cankao-sys` → `systemReferenceImage`
  - `tab-cankao-user` → `referenceImages`（支持单链接、逗号分隔、JSON 数组三种格式）
  - `tab-prompt` → `promptTemplate`
  - `tab-placeholder` → `inputPlaceholder`
  - 假设存在 `tab-name` 作为 Tab 名称（若无，回退到 `name/title/id` 或首列）

## 技术实现
- 前端通过 Supabase REST 读取，避免新增前端 SDK 依赖：
  - 请求：`GET ${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/haibao-generation-tab?select=*&order=num.asc`
  - 头部：`Authorization: Bearer ${EXPO_PUBLIC_SUPABASE_ANON_KEY}` 与 `apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}`
- 在 `poster-generation.tsx`：
  1. 新增本地类型 `SupabaseTabRow`，定义以上字段（包含带连字符的列使用 `row['tab-pre']` 访问）。
  2. `useEffect` 首次加载时拉取数据，映射为：
     - `tabConfigs: Record<string, TabConfig>`（键为 `tab-name`）
     - `stylesList: { id, name, gradientColors, image }[]`（`image` 来自 `tab-pre`）
     - 初始 `selectedStyle` 设置为首条的 `tab-name`；如失败，回退到旧值 `'趣味图文'`。
  3. 更新所有引用 `TAB_CONFIGS[selectedStyle]` 的地方，改为读 `tabConfigs[selectedStyle]` 并处理未加载的判空（例如 `?.inputPlaceholder || ''`）。
  4. `generatePrompt` 改为从 `tabConfigs` 取 `promptTemplate/prompt` 并沿用现有拼接规则（保留 `{dynamicContent}` 与 `{拼接文本}` 占位符逻辑）。
- 兼容性：
  - `tab-cankao-user` 支持三种格式：
    - 单 URL：直接封装为数组
    - 逗号分隔：按逗号拆分并 trim
    - JSON 数组字符串：`JSON.parse` 后过滤非字符串
  - 任何空值均转为空数组或 `null`，避免运行期错误。

## 安全与配置
- 在 Supabase 为 `haibao-generation-tab` 启用 RLS 并开放匿名只读：
  - `alter table "haibao-generation-tab" enable row level security;`
  - `create policy "anon read" on "haibao-generation-tab" for select to anon using (true);`
- 在前端环境变量中设置：
  - `EXPO_PUBLIC_SUPABASE_URL = https://twgrphjkqbqbrdtlcnvz.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_JxfrJNFuP4REUXljBhwssw_F2BQadV-`

## 验证
- 启动前端，确认：
  - Tab 列表按照 `num` 升序展示；缩略图来自 `tab-pre`。
  - 切换 Tab 时：
    - 默认参考图来自 `tab-cankao-user`，系统图来自 `tab-cankao-sys`；
    - 输入框占位符展示 `tab-placeholder`；
    - 生成提示词按 `tab-prompt` 模板拼接菜品名。
- 断网/表空：保持回退逻辑不影响页面，提示轻量错误并使用原默认选项。

## 我将进行的文件改动（获批后）
1. 修改 `app/poster-generation.tsx`：移除静态常量，新增 useEffect 拉取 Supabase REST，创建 `tabConfigs` 与动态 `stylesList`，并在 UI 与 `generatePrompt` 中替换引用。
2. 在 `.env` 或 Expo 环境中增加 `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`（不提交密钥到仓库）。
3. 提供一段可选的 SQL 为表开放匿名只读策略（仅说明，不在仓库写死）。

请确认以上方案，我将开始替换并完成端到端联调。