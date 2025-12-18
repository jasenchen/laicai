## 目标
- 把生成结果页的两个远程 SVG 图标改为本地资源：
  - 返回图标：`assets/UI/arrow-back.svg`
  - 保存图标：`assets/UI/ic-cloud-download.svg`

## 涉及文件
- `app/generation-result.tsx`

## 实施步骤
1) 引入与状态
- 在文件顶部引入：`import { Asset } from 'expo-asset'`
- 在组件内新增两个状态：`backSvgUri`、`downloadSvgUri`

2) 预加载本地 SVG
- 在 `useEffect` 中：
  - `const back = Asset.fromModule(require('../assets/UI/arrow-back.svg')); setBackSvgUri(back.uri);`
  - `const dl = Asset.fromModule(require('../assets/UI/ic-cloud-download.svg')); setDownloadSvgUri(dl.uri);`

3) 替换渲染处
- 将当前两个 `SvgUri` 使用的远程 URL 改为条件渲染本地 URI：
  - 返回按钮处：`backSvgUri && <SvgUri uri={backSvgUri} .../>`
  - 保存按钮处：`downloadSvgUri && <SvgUri uri={downloadSvgUri} .../>`

## 验证
- 启动开发环境，打开生成结果页，确认两个图标正常显示且在弱网下也可用
- 检查点击返回与保存行为不受影响

## 备注
- 保留 `SvgUri` 用法以保持现有样式与平台兼容；若你希望改为 `react-native-svg-transformer` 直接 `import` SVG 组件，我可提供替代方案