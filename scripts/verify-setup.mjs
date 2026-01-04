/**
 * PaperGenie Setup Verification Script
 * Run with: node scripts/verify-setup.mjs
 * 
 * This script checks if all required services and configurations are in place.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 PaperGenie Setup Verification\n');
console.log('='.repeat(50));

let allChecksPass = true;

// Helper function to check a condition
function check(name, condition, successMsg, errorMsg) {
  if (condition) {
    console.log(`✅ ${name}: ${successMsg}`);
  } else {
    console.log(`❌ ${name}: ${errorMsg}`);
    allChecksPass = false;
  }
}

// 1. Check environment file
console.log('\n📋 Environment Configuration:');
const envLocalPath = path.join(rootDir, '.env.local');
const envLocalExists = fs.existsSync(envLocalPath);
check(
  '.env.local file',
  envLocalExists,
  'Found',
  'Missing - copy .env.example to .env.local and configure'
);

if (envLocalExists) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  
  check(
    'MONGO_URI',
    envContent.includes('MONGO_URI=') && !envContent.includes('MONGO_URI=mongodb://localhost:27017/papergenie\n'),
    'Configured',
    'Not configured - set your MongoDB connection string'
  );
  
  check(
    'JWT_SECRET',
    envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=papergenie-local-dev'),
    'Configured',
    'Using default - consider changing for security'
  );
}

// 2. Check Node.js dependencies
console.log('\n📦 Node.js Dependencies:');
const nodeModulesPath = path.join(rootDir, 'node_modules');
check(
  'node_modules',
  fs.existsSync(nodeModulesPath),
  'Installed',
  'Missing - run: npm install'
);

// 3. Check Python virtual environment
console.log('\n🐍 Python Environment:');
const flaskEnvPath = path.join(rootDir, 'flask_embedding_api', 'embedding_env');
check(
  'Flask virtual environment',
  fs.existsSync(flaskEnvPath),
  'Created',
  'Missing - run: cd flask_embedding_api && python -m venv embedding_env'
);

// Check if sentence-transformers is likely installed (check for the directory structure)
const sitePackagesPath = path.join(flaskEnvPath, 'Lib', 'site-packages');
const sentenceTransformersPath = path.join(sitePackagesPath, 'sentence_transformers');
if (fs.existsSync(sitePackagesPath)) {
  check(
    'Python dependencies',
    fs.existsSync(sentenceTransformersPath) || fs.readdirSync(sitePackagesPath).length > 10,
    'Likely installed',
    'May be missing - activate venv and run: pip install -r requirements.txt'
  );
}

// 4. Check required files
console.log('\n📄 Required Files:');
const requiredFiles = [
  'package.json',
  'flask_embedding_api/app.py',
  'flask_embedding_api/requirements.txt',
  'src/pages/api/assessment/generate-ai-questions.js',
  'src/pages/api/health.js',
];

requiredFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  check(
    file,
    fs.existsSync(filePath),
    'Found',
    'Missing'
  );
});

// 5. Service connectivity checks (will fail if services aren't running)
console.log('\n🌐 Service Connectivity:');
console.log('   (These require services to be running)');

async function checkService(name, url, timeout = 3000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      method: 'GET'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

const services = [
  { name: 'ChromaDB', url: 'http://localhost:8000/api/v2/heartbeat' },
  { name: 'Flask API', url: 'http://localhost:5000/health' },
  { name: 'Next.js', url: 'http://localhost:3000' },
];

for (const service of services) {
  const isRunning = await checkService(service.name, service.url);
  if (isRunning) {
    console.log(`   ✅ ${service.name}: Running at ${service.url.split('/')[2]}`);
  } else {
    console.log(`   ⚪ ${service.name}: Not running (start with appropriate command)`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allChecksPass) {
  console.log('\n🎉 All configuration checks passed!');
  console.log('\n📖 Next steps:');
  console.log('   1. Start ChromaDB:  chroma run --host localhost --port 8000');
  console.log('   2. Start Flask API: cd flask_embedding_api && python app.py');
  console.log('   3. Start Next.js:   npm run dev');
  console.log('   4. Open browser:    http://localhost:3000');
  console.log('\n   Or run: scripts\\start-dev.bat (Windows) / scripts/start-dev.sh (Mac/Linux)');
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above before running.');
  console.log('\n📚 See README.md for detailed setup instructions.');
}

console.log('\n');
