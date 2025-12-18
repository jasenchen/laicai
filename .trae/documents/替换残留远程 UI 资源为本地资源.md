## 目标
- 仅删除 `app/poster.tsx` 文件。

## 依赖检查
- 全局搜索结果：无 `router.push('/poster')`、`<Link href="/poster">`、或对 `app/poster.tsx` 的 import 引用。
- 结论：删除该文件不会影响现有页面导航或构建。

## 操作步骤
- 删除 `app/poster.tsx`。
- 再次全局检索 `'/poster'` 与 `poster.tsx`，确认无残留。

## 验证
- 执行构建/启动，确保路由生成正常、无缺失页面或错误。

## 交付
- 完成删除并提供简要验证结果。