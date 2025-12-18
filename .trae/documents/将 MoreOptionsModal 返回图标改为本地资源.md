## 目标
- 把 `components/poster-generation/MoreOptionsModal.tsx#L282` 的远程 SVG 图标改为本地资源 `assets/UI/arrow-back.svg`

## 实施步骤
1) 引入本地资源能力
- 在文件顶部添加：`import { Asset } from 'expo-asset'`

2) 获取本地 SVG 的 uri
- 在模块作用域或组件内定义：
  - `const BACK_SVG = Asset.fromModule(require('../../assets/UI/arrow-back.svg'))`

3) 替换渲染处
- 将当前 `<SvgUri uri="https://.../arrow-back.svg" />` 改为：
  - `<SvgUri uri={BACK_SVG.uri} ... />`

## 验证
- 打开“更多选项”弹窗，确认返回按钮 SVG 正常显示；弱网环境下仍可显示

## 说明
- 采用 `expo-asset` 以适配 `SvgUri` 需要的 `uri` 字符串；无需引入 svg transformer