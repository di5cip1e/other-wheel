#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Build verification script
 * Ensures the build output is valid and meets requirements
 */

const DIST_DIR = path.join(__dirname, '..', 'dist');
const REQUIRED_FILES = [
  'index.html',
  'wheel-game.js',
  'wheel-game.css'
];

const MAX_BUNDLE_SIZE = 2 * 1024 * 1024; // 2MB
const MIN_BUNDLE_SIZE = 100 * 1024; // 100KB

function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file missing: ${filePath}`);
  }
  console.log(`✅ Found: ${path.basename(filePath)}`);
}

function checkFileSize(filePath, maxSize, minSize) {
  const stats = fs.statSync(filePath);
  const size = stats.size;
  
  if (size > maxSize) {
    throw new Error(`File too large: ${path.basename(filePath)} (${Math.round(size / 1024)}KB > ${Math.round(maxSize / 1024)}KB)`);
  }
  
  if (size < minSize) {
    throw new Error(`File too small: ${path.basename(filePath)} (${Math.round(size / 1024)}KB < ${Math.round(minSize / 1024)}KB)`);
  }
  
  console.log(`✅ Size OK: ${path.basename(filePath)} (${Math.round(size / 1024)}KB)`);
}

function checkJavaScriptSyntax(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Basic syntax checks
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    throw new Error(`Unmatched braces in ${path.basename(filePath)}`);
  }
  
  // Check for common build issues
  if (content.includes('undefined')) {
    console.warn(`⚠️  Warning: 'undefined' found in ${path.basename(filePath)}`);
  }
  
  if (content.includes('console.log') && process.env.NODE_ENV === 'production') {
    console.warn(`⚠️  Warning: console.log statements found in production build`);
  }
  
  console.log(`✅ Syntax OK: ${path.basename(filePath)}`);
}

function checkHTMLStructure(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for required HTML elements
  const requiredElements = [
    '<html',
    '<head>',
    '<body>',
    '<canvas',
    '</html>'
  ];
  
  for (const element of requiredElements) {
    if (!content.includes(element)) {
      throw new Error(`Missing required HTML element: ${element}`);
    }
  }
  
  // Check for meta tags
  if (!content.includes('<meta charset=')) {
    console.warn(`⚠️  Warning: Missing charset meta tag`);
  }
  
  if (!content.includes('<meta name="viewport"')) {
    console.warn(`⚠️  Warning: Missing viewport meta tag`);
  }
  
  console.log(`✅ HTML structure OK: ${path.basename(filePath)}`);
}

function checkCSSStructure(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Basic CSS validation
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    throw new Error(`Unmatched braces in CSS: ${path.basename(filePath)}`);
  }
  
  // Check for responsive design
  if (!content.includes('@media')) {
    console.warn(`⚠️  Warning: No media queries found - may not be responsive`);
  }
  
  console.log(`✅ CSS structure OK: ${path.basename(filePath)}`);
}

function generateBuildReport() {
  const report = {
    timestamp: new Date().toISOString(),
    files: {},
    totalSize: 0,
    passed: true
  };
  
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(DIST_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      report.files[file] = {
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024),
        exists: true
      };
      report.totalSize += stats.size;
    } else {
      report.files[file] = {
        exists: false
      };
      report.passed = false;
    }
  }
  
  report.totalSizeKB = Math.round(report.totalSize / 1024);
  
  // Write report
  const reportPath = path.join(DIST_DIR, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 Build report written to: ${reportPath}`);
  return report;
}

function main() {
  console.log('🔍 Verifying build output...\n');
  
  try {
    // Check if dist directory exists
    if (!fs.existsSync(DIST_DIR)) {
      throw new Error(`Build directory not found: ${DIST_DIR}`);
    }
    
    console.log('📁 Checking required files...');
    for (const file of REQUIRED_FILES) {
      const filePath = path.join(DIST_DIR, file);
      checkFileExists(filePath);
    }
    
    console.log('\n📏 Checking file sizes...');
    const jsFile = path.join(DIST_DIR, 'wheel-game.js');
    if (fs.existsSync(jsFile)) {
      checkFileSize(jsFile, MAX_BUNDLE_SIZE, MIN_BUNDLE_SIZE);
    }
    
    console.log('\n🔍 Checking file contents...');
    
    // Check JavaScript
    const jsPath = path.join(DIST_DIR, 'wheel-game.js');
    if (fs.existsSync(jsPath)) {
      checkJavaScriptSyntax(jsPath);
    }
    
    // Check HTML
    const htmlPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(htmlPath)) {
      checkHTMLStructure(htmlPath);
    }
    
    // Check CSS
    const cssPath = path.join(DIST_DIR, 'wheel-game.css');
    if (fs.existsSync(cssPath)) {
      checkCSSStructure(cssPath);
    }
    
    console.log('\n📊 Generating build report...');
    const report = generateBuildReport();
    
    console.log('\n🎉 Build verification completed successfully!');
    console.log(`📦 Total bundle size: ${report.totalSizeKB}KB`);
    
    if (report.totalSize > MAX_BUNDLE_SIZE) {
      console.warn(`⚠️  Warning: Total bundle size exceeds recommended maximum`);
    }
    
  } catch (error) {
    console.error(`\n❌ Build verification failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFileExists,
  checkFileSize,
  checkJavaScriptSyntax,
  checkHTMLStructure,
  checkCSSStructure,
  generateBuildReport
};