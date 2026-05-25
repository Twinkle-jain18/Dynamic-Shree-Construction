const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'UI'), stdio: 'inherit' });

  console.log('Building frontend...');
  execSync('npm run build', { cwd: path.join(__dirname, 'UI'), stdio: 'inherit' });

  console.log('Copying build output to root dist...');
  const srcDir = path.join(__dirname, 'UI', 'dist');
  const destDir = path.join(__dirname, 'dist');

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  copyFolderSync(srcDir, destDir);

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
