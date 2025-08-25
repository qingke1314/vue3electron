#!/bin/bash

echo "Electron-builder build should be complete. Starting upload to update server..."

# 定义变量
BUILD_OUTPUT_DIR="${BUILD_OUTPUT_DIR:-release}" # 使用环境变量或默认值
REMOTE_USER="sec"
REMOTE_HOST="118.178.197.208"
REMOTE_TARGET_DIR="/project/nestjs-secnote/updates"
MAX_RETRIES=3

# 检查输出目录是否存在
if [ ! -d "$BUILD_OUTPUT_DIR" ]; then
  echo "Error: Build output directory '$BUILD_OUTPUT_DIR' not found!"
  exit 1
fi

# 上传文件的函数
upload_file() {
  local file=$1
  local retry=0
  local success=false

  while [ $retry -lt $MAX_RETRIES ] && [ "$success" = false ]; do
    echo "Uploading $file (attempt $((retry + 1))/$MAX_RETRIES)..."
    # SCP 路径处理: Windows路径需要转换为POSIX格式
    # 如果scp命令失败，可能是因为路径包含空格或反斜杠
    local scp_path=$(echo "$file" | sed 's/\\/\\\\/g' | sed 's/ /\\ /g')
    if scp -r "$scp_path" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_TARGET_DIR}/"; then
      success=true
      echo "Successfully uploaded $file"
    else
      retry=$((retry + 1))
      if [ $retry -lt $MAX_RETRIES ]; then
        echo "Upload failed, retrying in 5 seconds..."
        sleep 5
      else
        echo "Failed to upload $file after $MAX_RETRIES attempts"
        return 1
      fi
    fi
  done
}

# 确保远程目录存在
echo "Creating remote directory if it doesn't exist..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_TARGET_DIR}"

# 动态判断并上传 latest.yml
# 优先检查 latest-mac.yml，然后是 latest.yml
if [ -f "$BUILD_OUTPUT_DIR/latest-mac.yml" ]; then
  echo "Uploading latest-mac.yml..."
  upload_file "$BUILD_OUTPUT_DIR/latest-mac.yml"
elif [ -f "$BUILD_OUTPUT_DIR/latest.yml" ]; then
  echo "Uploading latest.yml..."
  upload_file "$BUILD_OUTPUT_DIR/latest.yml"
else
  echo "Error: Neither latest-mac.yml nor latest.yml found in $BUILD_OUTPUT_DIR"
  exit 1
fi

# 上传安装包和 blockmap 文件
echo "Uploading installers and blockmaps..."
# 使用 find 命令查找所有相关文件
find "$BUILD_OUTPUT_DIR" -maxdepth 1 \( \
  -name "*.exe" -o \
  -name "*.exe.blockmap" -o \
  -name "*.dmg" -o \
  -name "*.dmg.blockmap" -o \
  -name "*.AppImage" -o \
  -name "*.AppImage.blockmap" -o \
  -name "*.zip" -o \
  -name "*.zip.blockmap" -o \
  -name "*.snap" \
\) -print0 | while IFS= read -r -d '' file; do
  # 检查文件是否为目录
  if [ -f "$file" ]; then
      upload_file "$file"
  fi
done

echo "Verifying uploaded files..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "ls -l ${REMOTE_TARGET_DIR}"

echo "Upload process completed."