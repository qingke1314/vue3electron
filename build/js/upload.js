// upload-hook.js
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 等待文件生成的函数
function waitForFile(filePath, maxAttempts = 10, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkFile = () => {
      attempts++;
      if (fs.existsSync(filePath)) {
        console.log(`File found after ${attempts} attempts: ${filePath}`);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.error(`File not found after ${maxAttempts} attempts: ${filePath}`);
        reject(new Error(`File not found: ${filePath}`));
      } else {
        console.log(`Waiting for file (attempt ${attempts}/${maxAttempts}): ${filePath}`);
        setTimeout(checkFile, interval);
      }
    };

    checkFile();
  });
}

// 上传函数
async function uploadFiles() {
  console.log('INFO: Starting upload process...');

  // 从 package.json 获取版本号
  const packageJson = require('../../package.json');
  const version = packageJson.version;

  // 定义输出目录
  const outDir = path.join(__dirname, '../../release');

  // 定义需要检查的文件
  const latestYmlPath = path.join(outDir, 'latest.yml');
  const exePath = path.join(outDir, `SecNote Setup ${version}.exe`);
  const blockmapPath = path.join(outDir, `SecNote Setup ${version}.exe.blockmap`);

  try {
    // 等待 latest.yml 文件生成
    console.log('Waiting for latest.yml to be generated...');
    await waitForFile(latestYmlPath);

    // 验证其他必要文件是否存在
    const requiredFiles = [exePath, blockmapPath];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.error(`ERROR: Required file not found: ${file}`);
        throw new Error(`Required file not found: ${file}`);
      }
    }

    console.log(`INFO: Output directory: ${outDir}`);
    console.log(`INFO: Files to upload:
      - ${latestYmlPath}
      - ${exePath}
      - ${blockmapPath}
    `);

    const uploadScriptPath = path.join(__dirname, '../../upload.sh');

    if (!fs.existsSync(uploadScriptPath)) {
      console.error(`ERROR: Upload script not found at ${uploadScriptPath}`);
      throw new Error(`Upload script not found at ${uploadScriptPath}`);
    }

    let bashExePath = 'D:\\Program Files\\Git\\bin\\bash.exe';

    if (!fs.existsSync(bashExePath)) {
      console.error(`ERROR: bash.exe not found at specified path: ${bashExePath}`);
      console.log("Attempting to use 'bash' from PATH...");
      bashExePath = 'bash';
    } else {
      console.log(`INFO: Using bash from: ${bashExePath}`);
    }

    const env = {
      ...process.env,
      BUILD_OUTPUT_DIR: outDir,
      ELECTRON_BUILDER_VERSION: version,
    };

    console.log(`INFO: Executing: ${bashExePath} ${uploadScriptPath}`);
    const result = spawnSync(bashExePath, [uploadScriptPath], {
      stdio: 'inherit',
      shell: false,
      env: env,
    });

    if (result.error) {
      console.error('ERROR: Failed to start upload script.', result.error);
      throw result.error;
    }
    if (result.status !== 0) {
      console.error(`ERROR: Upload script exited with code ${result.status}.`);
      throw new Error(`Upload script exited with code ${result.status}`);
    }
    console.log('INFO: Upload script finished successfully.');
  } catch (error) {
    console.error('ERROR: Upload process failed.', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  uploadFiles();
} else {
  // 如果作为 electron-builder 钩子运行
  module.exports = uploadFiles;
}
