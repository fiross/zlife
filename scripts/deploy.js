import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables (.env.deploy first, then .env)
const envDeployPath = path.join(ROOT_DIR, '.env.deploy');
if (fs.existsSync(envDeployPath)) {
  dotenv.config({ path: envDeployPath });
} else {
  dotenv.config({ path: path.join(ROOT_DIR, '.env') });
}

const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASS = process.env.FTP_PASS;
const FTP_PORT = parseInt(process.env.FTP_PORT || '21', 10);
const REMOTE_DIR = process.env.FTP_REMOTE_DIR || '/';
const SITE_URL = process.env.SITE_URL;

const args = process.argv.slice(2);
const shouldBuild = !args.includes('--no-build');
const overwriteConfig = args.includes('--config');

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error('\x1b[31m[ERROR]\x1b[0m Missing FTP credentials in .env.deploy!');
  console.error('Please define FTP_HOST, FTP_USER, and FTP_PASS in .env.deploy.');
  console.error('(.env.deploy is git-ignored and will never be committed to public repositories).');
  process.exit(1);
}

async function deploy() {
  console.log('\n\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m🚀  Daily Tracker - Direct Deployment to Hostinger \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m\n');

  // Step 1: Build React Production Bundle
  if (shouldBuild) {
    console.log('\x1b[34m[1/4]\x1b[0m Building React frontend (vite build)...');
    try {
      execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log('\x1b[32m✔ Build complete.\x1b[0m\n');
    } catch (e) {
      console.error('\x1b[31m✖ Build failed. Deployment aborted.\x1b[0m');
      process.exit(1);
    }
  } else {
    console.log('\x1b[33m[1/4]\x1b[0m Skipping build (--no-build flag active).\n');
  }

  // Validate that dist exists
  const distDir = path.join(ROOT_DIR, 'dist');
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('\x1b[31m✖ Error: dist/index.html not found! Run npm run build first.\x1b[0m');
    process.exit(1);
  }

  // Step 2: Connect to Hostinger FTP
  const client = new ftp.Client();
  client.ftp.verbose = false; // Set to true if deep protocol debugging is needed

  try {
    console.log(`\x1b[34m[2/4]\x1b[0m Connecting to ${FTP_HOST} as ${FTP_USER}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      port: FTP_PORT,
      secure: false
    });
    console.log('\x1b[32m✔ Connected successfully.\x1b[0m\n');

    // Ensure working in target directory
    if (REMOTE_DIR && REMOTE_DIR !== '/') {
      await client.ensureDir(REMOTE_DIR);
    }

    // Step 3: Handle default.php and config.php preservation
    console.log('\x1b[34m[3/4]\x1b[0m Checking remote environment & permissions...');
    const remoteList = await client.list();
    const remoteNames = remoteList.map(f => f.name);

    // Remove Hostinger default placeholder if present
    if (remoteNames.includes('default.php')) {
      console.log('   Removing Hostinger default.php placeholder...');
      try {
        await client.remove('default.php');
        console.log('\x1b[32m   ✔ Removed default.php\x1b[0m');
      } catch (err) {
        console.log('\x1b[33m   ℹ Could not remove default.php (may already be deleted or protected)\x1b[0m');
      }
    }

    // Protect remote config.php unless explicit --config passed
    let uploadConfigFile = false;
    if (remoteNames.includes('config.php')) {
      if (overwriteConfig) {
        console.log('\x1b[33m   [CONFIG] Overwriting remote config.php (--config flag passed)...\x1b[0m');
        uploadConfigFile = true;
      } else {
        console.log('\x1b[32m   ✔ Preserved existing remote config.php (database credentials intact).\x1b[0m');
      }
    } else {
      console.log('   Remote config.php not found. Uploading local config.php...');
      uploadConfigFile = true;
    }

    // Step 4: Upload all application files
    console.log('\n\x1b[34m[4/4]\x1b[0m Uploading application files...');

    // A. Upload dist/index.html -> index.html
    const localIndex = path.join(distDir, 'index.html');
    await client.uploadFrom(localIndex, 'index.html');
    console.log('   ✔ index.html');

    // B. Upload .htaccess
    const localHtaccess = path.join(ROOT_DIR, '.htaccess');
    if (fs.existsSync(localHtaccess)) {
      await client.uploadFrom(localHtaccess, '.htaccess');
      console.log('   ✔ .htaccess');
    }

    // C. Upload config.php if required
    if (uploadConfigFile) {
      const localConfig = path.join(ROOT_DIR, 'config.php');
      if (fs.existsSync(localConfig)) {
        await client.uploadFrom(localConfig, 'config.php');
        console.log('   ✔ config.php');
      }
    }

    // D. Upload dist/assets/ -> assets/
    const localAssetsDir = path.join(distDir, 'assets');
    if (fs.existsSync(localAssetsDir)) {
      await client.ensureDir('assets');
      await client.uploadFromDir(localAssetsDir, 'assets');
      console.log('   ✔ assets/ (compiled JS, CSS, fonts, SVG icons)');
      // Return to root directory
      await client.cd(REMOTE_DIR);
    }

    // E. Upload api/ -> api/
    const localApiDir = path.join(ROOT_DIR, 'api');
    if (fs.existsSync(localApiDir)) {
      await client.ensureDir('api');
      await client.uploadFromDir(localApiDir, 'api');
      console.log('   ✔ api/ (PHP REST API: auth, settings, lists, logs, passcodes)');
      await client.cd(REMOTE_DIR);
    }

    console.log('\n\x1b[32m====================================================\x1b[0m');
    console.log('\x1b[32m🎉  DEPLOYMENT SUCCESSFUL!                          \x1b[0m');
    console.log('\x1b[32m====================================================\x1b[0m');
    if (SITE_URL) {
      console.log(`\nLive Site: \x1b[36m${SITE_URL}\x1b[0m\n`);
    }

  } catch (error) {
    console.error('\n\x1b[31m✖ Deployment failed with error:\x1b[0m', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
