## 前置准备
- Apple 开发者账号已在 Xcode 登录（Xcode → Settings → Accounts）
- 连接 iPhone，设备已信任电脑并开启 Developer Mode（iOS 16+ 在 设置 → 隐私与安全 → 开发者模式）
- Bundle Identifier 与证书/描述文件匹配（`app.json` 的 `expo.ios.bundleIdentifier` 与 Xcode 中保持一致）
- 使用 Workspace 打开工程：`ios/app.xcworkspace`，Scheme 选择 `app`

## 签名配置（Xcode UI）
- 目标：Target `app` → Signing & Capabilities
- 勾选 `Automatically manage signing`
- Team 选择你的开发者团队
- 如需：添加能力（如 App Groups、Associated Domains 等）
- 确认 `PRODUCT_BUNDLE_IDENTIFIER` 与 `app.json` 一致（修改后需重新预构建）

## 代码与配置检查
- 环境变量：面向前端使用的变量需以 `EXPO_PUBLIC_*` 前缀（例如 `EXPO_PUBLIC_AIPA_API_DOMAIN`）
- JS Bundle：Release 构建会自动嵌入 JS，不依赖本地打包服务
- 如更改了 `app.json`（如 Bundle ID），运行：
  - `CI=1 npx expo prebuild --platform ios`
  - `cd ios && pod install`

## 方式一：Xcode 一键安装到设备
- 顶部设备列表选择已连接的 iPhone（`Any iOS Device (arm64)` 或设备名）
- Scheme：`app`，配置：`Release`
- 点击运行（▶︎），Xcode 自动构建并安装到设备

## 方式二：命令行构建并安装
- 获取设备 UDID：`xcrun xctrace list devices | grep -E "\(.*\)"`
- 直接对设备构建（自动签名）：
  - `xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release -destination 'id=<UDID>' -allowProvisioningUpdates build`
- 如需生成 IPA：
  - `xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release archive -archivePath ios/build/app.xcarchive -allowProvisioningUpdates`
  - `xcodebuild -exportArchive -archivePath ios/build/app.xcarchive -exportOptionsPlist ios/exportOptions.plist -exportPath ios/build`
- 无需 IPA 直接安装 `.app`（可选）：
  - 安装 `ios-deploy`：`brew install ios-deploy`
  - `ios-deploy --id <UDID> --bundle ios/build/DerivedData/Build/Products/Release-iphoneos/app.app`

## 验证与联调
- 启动后可离线加载 JS；网络请求需确保设备可访问你的服务域名（HTTPS 通过 ATS）
- 若服务使用非 HTTPS，需在 `ios/Info.plist` 添加 ATS 例外（Release 不建议）

## 常见问题
- 证书/描述文件不匹配：检查 Team、Bundle ID、一致的签名设置
- 设备未开启开发者模式：在设备设置中启用并重启
- 运行失败报签名错误：Xcode → Accounts 中刷新证书；`-allowProvisioningUpdates` 可自动修复
- 设备网络无法访问服务：确保域名可达、HTTPS 证书有效

## 我将为你执行
- 按你确认的方式（Xcode 或 CLI）进行 Release 构建并安装到已连接 iPhone
- 如需修改 Bundle ID 或签名，我会同步更新 `app.json` 与工程签名设置，重新预构建与安装