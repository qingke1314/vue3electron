# !/bin/bash
# deploy_dist.ps1

# --- 请根据您的实际情况修改以下变量 ---
SshUserName="sec"
SshHost="118.178.197.208"
RemoteBasePath="/project/web"
RemoteAppName="SecNote"

LocalDistPath="./dist"
# --- 变量配置结束 ---


# --- 变量配置结束 ---

# 远程服务器上的完整目标路径
RemoteTargetPath="${RemoteBasePath}/${RemoteAppName}"

# 检查本地 dist 文件夹是否存在
if [ ! -d "$LocalDistPath" ]; then
    echo "错误: 本地文件夹 '$LocalDistPath' 未找到。请确保路径正确，并且您已经运行了构建命令 (例如 npm run build)。"
    exit 1
fi

echo "准备上传 '$LocalDistPath' 到 '${SshUserName}@${SshHost}:${RemoteTargetPath}'..."

# 构建 scp 命令
# -r 表示递归复制文件夹
# -P <port> 如果您的SSH服务不是默认的22端口，可以在这里指定，例如 -P 2222
# 如果您使用SSH密钥，通常不需要额外操作，scp会自动查找默认密钥。
# 如果您的私钥文件不在默认位置，或有特定名称，您可能需要添加 -i "/c/path/to/your/private_key" (注意 MINGW64 中的路径格式)
ScpCommand="scp -r \"${LocalDistPath}\" \"${SshUserName}@${SshHost}:${RemoteTargetPath}\""
# 如果希望 dist 文件夹的内容直接上传到目标路径，而不是 dist 文件夹本身：
# ScpCommand="scp -r \"${LocalDistPath}/\"* \"${SshUserName}@${SshHost}:${RemoteTargetPath}/\""


echo "将要执行的命令: $ScpCommand"

# 执行命令
eval $ScpCommand

# 获取scp命令的退出码
exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "上传成功!"
else
    echo "上传失败。SCP退出代码: $exit_code"
    # 你可以在这里添加更详细的错误处理或日志记录
    exit 1
fi

echo "脚本执行完毕。"