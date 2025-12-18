## 目标
- 将首页上半部分入口文案“做朋友圈宣传图”的字体替换为本地字体：`assets/fonts/造字工房元黑体.ttf`

## 实施步骤
1) 字体加载
- 在应用入口（推荐 `app/_layout.tsx` 或 `app/index.tsx`）使用 `expo-font` 加载本地字体：
  - `import { useFonts } from 'expo-font'`
  - `const [loaded] = useFonts({ ZaoziYuanHei: require('../assets/fonts/造字工房元黑体.ttf') })`
  - 未加载完成时返回占位视图，避免闪烁

2) 文案定位与样式应用
- 在首页组件中找到“做朋友圈宣传图”对应的 `Text`，预计在 `components/home/HomeHeader.tsx` 或相关子组件的 `Text`
- 应用样式：`style={{ fontFamily: 'ZaoziYuanHei' }}`，与原字号/颜色保持一致
- 如存在多处同文案（标题与副标题），同步应用该字体

3) 平台兼容
- iOS/Android：`expo-font` 自动打包并可用
- Web（如需）：确保 `expo-font` 在 web 端也加载；或通过 CSS @font-face（可选）

4) 验证
- 启动应用，进入首页，确认“做朋友圈宣传图”渲染为指定本地字体，行高与断行正常
- 其他文本不受影响

## 代码定位参考
- 入口加载：`app/_layout.tsx` 或 `app/index.tsx`
- 文案组件：`components/home/HomeHeader.tsx`（顶部入口区域）

## 交付
- 提交字体加载代码与样式变更；在 iOS 模拟器演示替换效果