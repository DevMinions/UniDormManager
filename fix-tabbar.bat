@echo off
chcp 65001
 echo "=== 修复 TabBar 路径问题 ==="

REM 删除旧的 custom-tabbar 文件夹（如果存在）
if exist "UniDormManagerMini\components\custom-tabbar" (
    echo "删除旧的 custom-tabbar 文件夹..."
    rmdir /s /q "UniDormManagerMini\components\custom-tabbar"
    echo "已删除"
) else (
    echo "旧文件夹不存在，正常"
)

REM 检查新的 custom-tab-bar 文件夹是否存在
if exist "UniDormManagerMini\components\custom-tab-bar" (
    echo "✓ custom-tab-bar 文件夹存在"
) else (
    echo "✗ custom-tab-bar 文件夹不存在，需要从 git 拉取"
)

echo ""
echo "=== 操作完成 ==="
echo "请重新打开微信开发者工具"
pause
