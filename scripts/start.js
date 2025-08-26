#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Community Scam Registry - Startup Script');
console.log('==========================================\n');

// Check if .env file exists
function checkEnvironmentFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('💡 Please create a .env file based on the README.md instructions');
    console.log('📁 Expected location:', envPath);
    process.exit(1);
  }
  
  console.log('✅ .env file found');
}

// Check if node_modules exists
function checkDependencies() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ Dependencies not installed!');
    console.log('💡 Please run: npm install');
    process.exit(1);
  }
  
  console.log('✅ Dependencies installed');
}

// Check if dist folder exists for production
function checkBuild() {
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (process.env.NODE_ENV === 'production' && !fs.existsSync(distPath)) {
    console.error('❌ Production build not found!');
    console.log('💡 Please run: npm run build');
    process.exit(1);
  }
  
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Production build found');
  }
}

// Start the application
function startApp() {
  const isProduction = process.env.NODE_ENV === 'production';
  const script = isProduction ? 'start' : 'dev:backend';
  
  console.log(`\n🚀 Starting application in ${isProduction ? 'production' : 'development'} mode...`);
  console.log(`📝 Using script: ${script}`);
  
  const child = spawn('npm', ['run', script], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..'),
  });
  
  child.on('error', (error) => {
    console.error('💥 Failed to start application:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`💥 Application exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle process signals
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    child.kill('SIGTERM');
  });
}

// Main function
function main() {
  try {
    checkEnvironmentFile();
    checkDependencies();
    checkBuild();
    startApp();
  } catch (error) {
    console.error('💥 Startup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, checkEnvironmentFile, checkDependencies, checkBuild };
