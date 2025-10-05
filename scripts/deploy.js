#!/usr/bin/env node

/**
 * Deployment script for Wheel within a Wheel game
 * Handles production build, optimization, and deployment preparation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GameDeployer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.deploymentInfo = {
      timestamp: new Date().toISOString(),
      version: this.getVersion(),
      buildHash: '',
      files: [],
      size: 0,
      checks: {}
    };
  }

  getVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      return packageJson.version;
    } catch (error) {
      return '1.0.0';
    }
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...\n');
    
    const checks = {
      typeCheck: false,
      build: false,
      tests: false,
      linting: false,
      security: false,
      performance: false
    };

    // Type checking
    try {
      console.log('📝 Type checking...');
      execSync('npm run type-check', { stdio: 'pipe' });
      checks.typeCheck = true;
      console.log('✅ Type check passed');
    } catch (error) {
      console.log('❌ Type check failed');
      console.log(error.stdout?.toString() || error.message);
    }

    // Build test
    try {
      console.log('🏗️  Testing build...');
      execSync('npm run build', { stdio: 'pipe' });
      checks.build = true;
      console.log('✅ Build successful');
    } catch (error) {
      console.log('❌ Build failed');
      console.log(error.stdout?.toString() || error.message);
      return checks;
    }

    // Run tests (if they pass quickly)
    try {
      console.log('🧪 Running critical tests...');
      execSync('npm run test:unit -- --testTimeout=5000 --maxWorkers=2', { stdio: 'pipe', timeout: 30000 });
      checks.tests = true;
      console.log('✅ Critical tests passed');
    } catch (error) {
      console.log('⚠️  Some tests failed (continuing deployment)');
      // Don't fail deployment for test failures in this case
      checks.tests = false;
    }

    // Linting (warnings allowed)
    try {
      console.log('🔍 Linting code...');
      execSync('npm run lint', { stdio: 'pipe' });
      checks.linting = true;
      console.log('✅ Linting passed');
    } catch (error) {
      console.log('⚠️  Linting issues found (continuing deployment)');
      checks.linting = false;
    }

    // Security audit
    try {
      console.log('🔒 Security audit...');
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      checks.security = true;
      console.log('✅ Security audit passed');
    } catch (error) {
      console.log('⚠️  Security issues found (review recommended)');
      checks.security = false;
    }

    // Performance check (bundle size)
    try {
      console.log('⚡ Performance check...');
      const stats = this.analyzeBundleSize();
      if (stats.totalSize < 500 * 1024) { // 500KB limit
        checks.performance = true;
        console.log(`✅ Bundle size OK (${Math.round(stats.totalSize / 1024)}KB)`);
      } else {
        console.log(`⚠️  Bundle size large (${Math.round(stats.totalSize / 1024)}KB)`);
        checks.performance = false;
      }
    } catch (error) {
      console.log('⚠️  Performance check failed');
      checks.performance = false;
    }

    this.deploymentInfo.checks = checks;
    return checks;
  }

  analyzeBundleSize() {
    const distFiles = fs.readdirSync(this.distPath);
    let totalSize = 0;
    const files = [];

    distFiles.forEach(file => {
      const filePath = path.join(this.distPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
        files.push({
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024)
        });
      }
    });

    return { totalSize, files };
  }

  optimizeAssets() {
    console.log('\n🎨 Optimizing assets...');

    // Create optimized build
    try {
      execSync('npm run build:production', { stdio: 'inherit' });
      console.log('✅ Production build created');
    } catch (error) {
      console.log('❌ Production build failed');
      throw error;
    }

    // Analyze final bundle
    const bundleStats = this.analyzeBundleSize();
    this.deploymentInfo.files = bundleStats.files;
    this.deploymentInfo.size = bundleStats.totalSize;

    console.log('\n📊 Bundle Analysis:');
    bundleStats.files.forEach(file => {
      console.log(`   ${file.name}: ${file.sizeKB}KB`);
    });
    console.log(`   Total: ${Math.round(bundleStats.totalSize / 1024)}KB`);

    return bundleStats;
  }

  generateDeploymentManifest() {
    const manifestPath = path.join(this.distPath, 'deployment-manifest.json');
    
    // Add build hash
    const mainJsFile = this.deploymentInfo.files.find(f => f.name.includes('main.') && f.name.endsWith('.js'));
    if (mainJsFile) {
      const hashMatch = mainJsFile.name.match(/main\.([a-f0-9]+)\.js/);
      this.deploymentInfo.buildHash = hashMatch ? hashMatch[1] : 'unknown';
    }

    const manifest = {
      ...this.deploymentInfo,
      deployment: {
        instructions: [
          '1. Upload all files in the dist/ directory to your web server',
          '2. Ensure the server serves index.html for the root path',
          '3. Configure proper MIME types for .js, .css, and .html files',
          '4. Enable gzip compression for better performance',
          '5. Set appropriate cache headers for static assets'
        ],
        requirements: {
          server: 'Any static file server (Apache, Nginx, Netlify, Vercel, etc.)',
          https: 'Recommended for Web Audio API and other modern features',
          compression: 'Gzip or Brotli compression recommended',
          caching: 'Cache static assets with versioned filenames'
        },
        testing: [
          'Open index.html in supported browsers',
          'Test wheel spinning functionality',
          'Verify audio playback (requires user interaction)',
          'Test multiplayer mode with multiple players',
          'Verify responsive design on mobile devices'
        ]
      }
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📋 Deployment manifest created: ${manifestPath}`);

    return manifest;
  }

  createDeploymentPackage() {
    console.log('\n📦 Creating deployment package...');

    const packagePath = path.join(this.projectRoot, `wheel-game-v${this.deploymentInfo.version}.zip`);
    
    try {
      // Create zip file (requires zip command or 7zip)
      const zipCommand = process.platform === 'win32' 
        ? `powershell Compress-Archive -Path "${this.distPath}\\*" -DestinationPath "${packagePath}" -Force`
        : `cd "${this.distPath}" && zip -r "${packagePath}" .`;
      
      execSync(zipCommand, { stdio: 'pipe' });
      
      const packageStats = fs.statSync(packagePath);
      console.log(`✅ Deployment package created: ${path.basename(packagePath)} (${Math.round(packageStats.size / 1024)}KB)`);
      
      return packagePath;
    } catch (error) {
      console.log('⚠️  Could not create zip package (manual packaging required)');
      return null;
    }
  }

  generateReadme() {
    const readmePath = path.join(this.distPath, 'README.txt');
    
    const readme = `Wheel within a Wheel Game - Deployment Package
Version: ${this.deploymentInfo.version}
Build Date: ${new Date(this.deploymentInfo.timestamp).toLocaleString()}
Build Hash: ${this.deploymentInfo.buildHash}

DEPLOYMENT INSTRUCTIONS:
========================

1. UPLOAD FILES
   - Upload all files from this directory to your web server
   - Maintain the directory structure
   - Ensure index.html is accessible from your domain root

2. SERVER CONFIGURATION
   - Configure your server to serve index.html for the root path
   - Set proper MIME types:
     * .js files: application/javascript
     * .css files: text/css
     * .html files: text/html
   - Enable gzip compression for better performance

3. TESTING
   - Open your deployed URL in a modern browser
   - Test wheel spinning functionality
   - Verify audio works (may require user interaction)
   - Test on mobile devices for responsive design

4. BROWSER SUPPORT
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

5. FEATURES
   - Hot-seat multiplayer (2-8 players)
   - Physics-based wheel spinning
   - Customizable wheels and rules
   - Audio themes and effects
   - Responsive design for mobile/tablet

6. TROUBLESHOOTING
   - If audio doesn't work: Check browser autoplay policies
   - If performance is poor: Close other browser tabs
   - If layout breaks: Check browser compatibility

For technical support or questions, refer to the documentation
included in the original project repository.

Total Package Size: ${Math.round(this.deploymentInfo.size / 1024)}KB
Files Included: ${this.deploymentInfo.files.length}

Enjoy your Wheel within a Wheel game!
`;

    fs.writeFileSync(readmePath, readme);
    console.log(`📄 Deployment README created: ${readmePath}`);
  }

  async deploy() {
    console.log('🚀 Starting deployment process...\n');

    try {
      // Pre-deployment checks
      const checks = await this.runPreDeploymentChecks();
      
      const criticalChecksPassed = checks.typeCheck && checks.build;
      if (!criticalChecksPassed) {
        console.log('\n❌ Critical checks failed. Deployment aborted.');
        return false;
      }

      // Optimize assets
      this.optimizeAssets();

      // Generate deployment files
      this.generateDeploymentManifest();
      this.generateReadme();

      // Create package
      const packagePath = this.createDeploymentPackage();

      console.log('\n🎉 Deployment preparation complete!');
      console.log('\n📋 Deployment Summary:');
      console.log(`   Version: ${this.deploymentInfo.version}`);
      console.log(`   Build Hash: ${this.deploymentInfo.buildHash}`);
      console.log(`   Total Size: ${Math.round(this.deploymentInfo.size / 1024)}KB`);
      console.log(`   Files: ${this.deploymentInfo.files.length}`);
      
      console.log('\n✅ Quality Checks:');
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`   ${check}: ${passed ? '✅' : '⚠️'}`);
      });

      console.log('\n📁 Deployment Files:');
      console.log(`   📂 ${this.distPath}`);
      if (packagePath) {
        console.log(`   📦 ${packagePath}`);
      }

      console.log('\n🌐 Next Steps:');
      console.log('   1. Upload the dist/ directory contents to your web server');
      console.log('   2. Configure your server (see deployment-manifest.json)');
      console.log('   3. Test the deployed application');
      console.log('   4. Monitor performance and user feedback');

      return true;

    } catch (error) {
      console.error('\n💥 Deployment failed:', error.message);
      return false;
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new GameDeployer();
  
  deployer.deploy()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Deployment error:', error);
      process.exit(1);
    });
}

module.exports = GameDeployer;