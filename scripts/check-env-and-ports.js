#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking PLS Travels production setup...\n');

// Check .env.local exists
const envPath = path.join(path.dirname(__dirname), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found! Please create it with the required variables.');
  process.exit(1);
}

// Read and check environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const requiredVars = [
  'DATABASE_URL',
  'SESSION_SECRET', 
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const missingVars = [];
const placeholderVars = [];

for (const varName of requiredVars) {
  if (!envContent.includes(`${varName}=`)) {
    missingVars.push(varName);
  } else if (envContent.includes(`${varName}=your-`) || 
             envContent.includes(`${varName}=replace-with-`) ||
             envContent.includes(`${varName}=postgresql://USER:`)) {
    placeholderVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

if (placeholderVars.length > 0) {
  console.warn(`⚠️  Environment variables with placeholder values: ${placeholderVars.join(', ')}`);
  console.warn('   Please update these with real values before deployment.\n');
}

// Check Vite config
const viteConfigPath = path.join(path.dirname(__dirname), 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (viteConfig.includes('port: 3000') && viteConfig.includes('"/api": "http://localhost:4000"')) {
    console.log('✅ Vite config: Port 3000 with API proxy to localhost:4000');
  } else {
    console.warn('⚠️  Vite config: Please ensure port 3000 and API proxy to localhost:4000');
  }
}

// Check package.json scripts
const packagePath = path.join(path.dirname(__dirname), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = ['dev', 'dev:client', 'dev:server', 'build', 'start', 'migrate'];
  const missingScripts = requiredScripts.filter(script => !scripts[script]);
  
  if (missingScripts.length > 0) {
    console.warn(`⚠️  Missing scripts: ${missingScripts.join(', ')}`);
  } else {
    console.log('✅ Package.json scripts: All required scripts present');
  }
}

// Check deployment configs
const vercelPath = path.join(path.dirname(__dirname), 'vercel.json');
const renderPath = path.join(path.dirname(__dirname), 'render.yaml');

if (fs.existsSync(vercelPath)) {
  console.log('✅ Vercel config: vercel.json present');
} else {
  console.warn('⚠️  Vercel config: vercel.json missing');
}

if (fs.existsSync(renderPath)) {
  console.log('✅ Render config: render.yaml present');
} else {
  console.warn('⚠️  Render config: render.yaml missing');
}

console.log('\n📋 Next Steps:');
console.log('1. Fill .env.local with real values');
console.log('2. Run: npm run dev');
console.log('3. Test: http://localhost:3000 and http://localhost:4000/api/health');
console.log('4. Push to GitHub');
console.log('5. Create Neon DB and run migrations');
console.log('6. Deploy backend on Render');
console.log('7. Update vercel.json with Render URL and deploy frontend');

console.log('\n🎉 Environment check complete!');
