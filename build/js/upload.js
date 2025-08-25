// upload-hook.js
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os'); // 导入 os 模块

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

/**
 * 跨平台执行 shell 脚本
 * @param {string} scriptPath 脚本路径
 * @param {string} shell 可选，指定 shell，例如 'bash'
 */
function runShellScript(scriptPath, shell = 'bash') {
  let executable = shell;
  if (os.platform() === 'win32') {
    // Windows 上使用 Git Bash
    const gitBashPath = 'D:\\Program Files\\Git\\bin\\bash.exe';
    if (fs.existsSync(gitBashPath)) {
      executable = gitBashPath;
    } else {
      console.warn(
        "Git Bash not found at D:\\Program Files\\Git\\bin\\bash.exe. Using 'bash' from PATH."
      );
      // 如果 Git Bash 不在指定位置，则从环境变量中查找
      executable = 'bash';
    }
  }

  console.log(`INFO: Executing: ${executable} ${scriptPath}`);
  const result = spawnSync(executable, [scriptPath], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env }, // 传递所有环境变量
  });

  if (result.error) {
    console.error('ERROR: Failed to start script.', result.error);
    throw result.error;
  }
  if (result.status !== 0) {
    console.error(`ERROR: Script exited with code ${result.status}.`);
    throw new Error(`Script exited with code ${result.status}`);
  }
  console.log('INFO: Script finished successfully.');
}

// 上传函数
async function uploadFiles() {
  console.log('INFO: Starting upload process...');
  const packageJson = require('../../package.json');
  const version = packageJson.version;
  const outDir = path.join(__dirname, '../../release');

  // 根据平台动态确定文件名和路径
  let latestYmlFileName, buildFileBaseName;
  if (os.platform() === 'win32') {
    latestYmlFileName = 'latest.yml';
    buildFileBaseName = `SecNote Setup ${version}.exe`;
  } else if (os.platform() === 'darwin') {
    // macOS
    latestYmlFileName = 'latest-mac.yml';
    buildFileBaseName = `SecNote-${version}-arm64.dmg`;
  } else {
    // 默认回退
    console.warn(`WARN: Unsupported platform ${os.platform()}. Using default Windows filenames.`);
    latestYmlFileName = 'latest.yml';
    buildFileBaseName = `SecNote Setup ${version}.exe`;
  }

  const latestYmlPath = path.join(outDir, latestYmlFileName);
  const buildFilePath = path.join(outDir, buildFileBaseName);

  try {
    // 1. 等待 latest.yml 文件生成
    console.log('Waiting for latest YML to be generated...');
    await waitForFile(latestYmlPath);

    // 2. 检查必要的打包文件是否存在
    const requiredFiles = [latestYmlPath, buildFilePath];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.error(`ERROR: Required file not found: ${file}`);
        throw new Error(`Required file not found: ${file}`);
      }
    }

    console.log(`INFO: Output directory: ${outDir}`);
    console.log(`INFO: Files to upload: ${requiredFiles.join(', ')}`);

    // 3. 执行上传脚本
    const uploadScriptPath = path.join(__dirname, 'upload.sh'); // 假设 upload.sh 在同一目录
    if (!fs.existsSync(uploadScriptPath)) {
      console.error(`ERROR: Upload script not found at ${uploadScriptPath}`);
      throw new Error(`Upload script not found at ${uploadScriptPath}`);
    }

    // 运行脚本并传递参数
    runShellScript(uploadScriptPath);
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
