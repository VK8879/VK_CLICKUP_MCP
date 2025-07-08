/**
 * Startup debugging wrapper for Railway deployment
 * Helps identify why the MCP server might be crashing
 */

console.log('🚀 Starting ClickUp MCP Server debugging...');
console.log('📊 Environment Check:');
console.log('  Node.js version:', process.version);
console.log('  Platform:', process.platform);
console.log('  Architecture:', process.arch);
console.log('  Working directory:', process.cwd());
console.log('  Memory usage:', process.memoryUsage());

// Check environment variables
console.log('🔐 Environment Variables:');
console.log('  PORT:', process.env.PORT || 'Not set');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('  CLICKUP_API_KEY:', process.env.CLICKUP_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  CLICKUP_TEAM_ID:', process.env.CLICKUP_TEAM_ID ? '✅ Set' : '❌ Missing');
console.log('  DOCUMENT_SUPPORT:', process.env.DOCUMENT_SUPPORT || 'false');
console.log('  LOG_LEVEL:', process.env.LOG_LEVEL || 'info');

// Check if build directory exists
console.log('📁 File System Check:');
const fs = require('fs');
const path = require('path');

const checkPaths = [
  'build/index.js',
  'package.json',
  'node_modules'
];

checkPaths.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  console.log(`  ${filePath}: ${exists ? '✅ Exists' : '❌ Missing'}`);
  
  if (filePath === 'build/index.js' && exists) {
    try {
      const stats = fs.statSync(filePath);
      console.log(`    Size: ${stats.size} bytes`);
      console.log(`    Executable: ${(stats.mode & 0o111) !== 0 ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log(`    Error reading stats: ${error.message}`);
    }
  }
});

// Test basic imports
console.log('📚 Import Test:');
try {
  console.log('  Testing Node.js built-ins...');
  require('http');
  require('path');
  require('fs');
  console.log('  ✅ Node.js built-ins OK');
} catch (error) {
  console.error('  ❌ Node.js built-ins failed:', error.message);
}

// Check if we can load the main application
console.log('🔄 Application Loading Test:');
try {
  console.log('  Attempting to load main application...');
  
  // Try to import the main index file
  if (fs.existsSync('build/index.js')) {
    console.log('  ✅ Main application file exists');
    
    // Check if it's a valid JavaScript file
    const content = fs.readFileSync('build/index.js', 'utf8');
    if (content.length > 0) {
      console.log(`  ✅ Main application file has content (${content.length} chars)`);
    } else {
      console.log('  ❌ Main application file is empty');
    }
  } else {
    console.log('  ❌ Main application file missing');
  }
} catch (error) {
  console.error('  ❌ Application loading failed:', error.message);
  console.error('  Stack trace:', error.stack);
}

// Environment validation
console.log('🔍 Critical Environment Validation:');
const criticalEnvVars = ['CLICKUP_API_KEY', 'CLICKUP_TEAM_ID'];
let envValid = true;

criticalEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`  ❌ CRITICAL: Missing ${varName}`);
    envValid = false;
  } else {
    console.log(`  ✅ ${varName} is set`);
  }
});

if (!envValid) {
  console.error('💥 STARTUP FAILED: Missing critical environment variables');
  console.error('🔧 Fix: Set CLICKUP_API_KEY and CLICKUP_TEAM_ID in Railway dashboard');
  process.exit(1);
}

// Test ClickUp API connectivity
console.log('🌐 ClickUp API Connectivity Test:');
async function testClickUpAPI() {
  try {
    const https = require('https');
    
    const options = {
      hostname: 'api.clickup.com',
      port: 443,
      path: '/api/v2/user',
      method: 'GET',
      headers: {
        'Authorization': process.env.CLICKUP_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log(`  API Response Status: ${res.statusCode}`);
        console.log(`  Rate Limit Remaining: ${res.headers['x-ratelimit-remaining'] || 'Unknown'}`);
        
        if (res.statusCode === 200) {
          console.log('  ✅ ClickUp API connection successful');
          resolve(true);
        } else {
          console.log(`  ❌ ClickUp API returned status ${res.statusCode}`);
          resolve(false);
        }
      });

      req.on('error', (error) => {
        console.error('  ❌ ClickUp API connection failed:', error.message);
        resolve(false);
      });

      req.on('timeout', () => {
        console.error('  ❌ ClickUp API connection timed out');
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    console.error('  ❌ ClickUp API test error:', error.message);
    return false;
  }
}

// Run the API test and then start the main application
(async () => {
  await testClickUpAPI();
  
  console.log('✅ Debugging complete. Starting main application...');
  console.log('=' .repeat(60));
  
  try {
    // Import and run the original application
    const mainApp = await import('./index.js');
    if (typeof mainApp.default === 'function') {
      await mainApp.default();
    } else if (typeof mainApp.main === 'function') {
      await mainApp.main();
    } else {
      console.log('Main application loaded successfully');
    }
  } catch (error) {
    console.error('💥 Failed to start main application:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
})();
