## 目标
- 修复 “The sandbox is not in sync with the Podfile.lock” 错误
- 完成 `pod install` 生成 `Podfile.lock` 与 `Pods`
- 使用 `ios/app.xcworkspace` 构建并在模拟器运行

## 环境检查
- 检查是否安装 Homebrew：`brew -v`
- 若未安装（此前报 `spawn brew ENOENT`），先安装 Homebrew：
  - `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
  - 令当前 shell 生效（Apple Silicon）：`eval "$($(which brew) shellenv)"` 或 `eval "$(/opt/homebrew/bin/brew shellenv)"`

## 安装 CocoaPods（推荐）
- 使用 Homebrew 安装：`brew install cocoapods`
- 验证：`pod --version`

## 安装 Pods
- 进入 iOS 目录：`cd ios`
- 如之前构建失败或半生成，先清理：`rm -rf Pods Podfile.lock`
- 安装并更新 Specs 索引：`pod install --repo-update`
- 成功后会生成 `Pods/` 与 `Podfile.lock`

## 使用 Workspace 构建
- 打开 Workspace：`open app.xcworkspace`
- 在 Xcode 选择 scheme `app` 与模拟器目标（如 `iPhone 17`），点击运行
- 命令行验证（可选）：
  - `xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' build`

## 备用方案（无 Homebrew）
- 使用 RubyGems 安装（需 Ruby ≥ 3.1）：
  - 安装 Ruby：`brew install ruby`
  - 加入 PATH：`export PATH="$(brew --prefix)/opt/ruby/bin:$PATH"`
  - 安装 CocoaPods：`gem install cocoapods --no-document`

## 验证标准
- `ios/Podfile.lock` 存在，Xcode 构建不再提示 sandbox 错误
- 模拟器成功构建并运行 `app` scheme

## 后续可选项
- 如需更改 Bundle ID、图标、启动图或权限：更新 `app.json` 后执行 `CI=1 npx expo prebuild --platform ios`，再 `cd ios && pod install`，在 Workspace 重新构建