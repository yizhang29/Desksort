cask "desksort" do
  version "0.1.0"
  sha256 "c7c79b22f23c7c1d9a045a521acbcb6b8c8996a02ab5b741fd8ebf95be3b431c"

  url "https://github.com/yizhang29/Desksort/releases/download/v#{version}/DeskSort_#{version}_universal.dmg"
  name "DeskSort"
  desc "Automatically organize your desktop files into folders"
  homepage "https://github.com/yizhang29/Desksort"

  app "DeskSort.app"

  zap trash: [
    "~/Library/Application Support/com.desksort.app",
    "~/Library/Preferences/com.desksort.app.plist",
  ]
end
