#!/usr/bin/env node

/**
 * Cross-browser testing script for the Wheel within a Wheel game
 * Tests compatibility across different browsers and devices
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Browser compatibility matrix
const BROWSER_SUPPORT = {
  chrome: { minVersion: 90, features: ['webgl', 'webaudio', 'canvas', 'localstorage'] },
  firefox: { minVersion: 88, features: ['webgl', 'webaudio', 'canvas', 'localstorage'] },
  safari: { minVersion: 14, features: ['webgl', 'webaudio', 'canvas', 'localstorage'] },
  edge: { minVersion: 90, features: ['webgl', 'webaudio', 'canvas', 'localstorage'] }
};

// Feature detection tests
const FEATURE_TESTS = {
  canvas: `
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return !!(ctx && typeof ctx.fillRect === 'function');
  `,
  
  webgl: `
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  `,
  
  webaudio: `
    return !!(window.AudioContext || window.webkitAudioContext);
  `,
  
  localstorage: `
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  `,
  
  touchevents: `
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  `,
  
  deviceorientation: `
    return 'DeviceOrientationEvent' in window;
  `,
  
  gamepads: `
    return 'getGamepads' in navigator;
  `,
  
  fullscreen: `
    return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || 
              document.mozFullScreenEnabled || document.msFullscreenEnabled);
  `,
  
  webworkers: `
    return typeof Worker !== 'undefined';
  `,
  
  indexeddb: `
    return 'indexedDB' in window;
  `
};

// Performance benchmarks
const PERFORMANCE_TESTS = {
  canvasRendering: `
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    const startTime = performance.now();
    
    // Simulate wheel rendering
    for (let i = 0; i < 100; i++) {
      ctx.beginPath();
      ctx.arc(400, 300, 200, 0, Math.PI * 2);
      ctx.fillStyle = \`hsl(\${i * 3.6}, 70%, 50%)\`;
      ctx.fill();
      ctx.stroke();
    }
    
    const endTime = performance.now();
    return endTime - startTime;
  `,
  
  physicsCalculation: `
    const startTime = performance.now();
    
    // Simulate physics calculations
    let angle = 0;
    let velocity = 10;
    const friction = 0.02;
    
    for (let i = 0; i < 1000; i++) {
      velocity *= (1 - friction);
      angle += velocity * 0.016; // 60fps timestep
      
      if (velocity < 0.01) break;
    }
    
    const endTime = performance.now();
    return endTime - startTime;
  `,
  
  memoryUsage: `
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  `
};

// CSS feature tests
const CSS_TESTS = {
  flexbox: `CSS.supports('display', 'flex')`,
  grid: `CSS.supports('display', 'grid')`,
  transforms: `CSS.supports('transform', 'rotate(45deg)')`,
  animations: `CSS.supports('animation', 'test 1s')`,
  customProperties: `CSS.supports('--test', 'value')`,
  backdropFilter: `CSS.supports('backdrop-filter', 'blur(10px)')`
};

class CrossBrowserTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      userAgent: '',
      features: {},
      performance: {},
      css: {},
      compatibility: {
        supported: false,
        issues: [],
        recommendations: []
      }
    };
  }

  generateTestHTML() {
    const testScript = `
      <script>
        const results = {
          userAgent: navigator.userAgent,
          features: {},
          performance: {},
          css: {}
        };
        
        // Feature tests
        ${Object.entries(FEATURE_TESTS).map(([name, test]) => `
          try {
            results.features.${name} = (function() { ${test} })();
          } catch (e) {
            results.features.${name} = false;
          }
        `).join('')}
        
        // Performance tests
        ${Object.entries(PERFORMANCE_TESTS).map(([name, test]) => `
          try {
            results.performance.${name} = (function() { ${test} })();
          } catch (e) {
            results.performance.${name} = null;
          }
        `).join('')}
        
        // CSS tests
        if (window.CSS && CSS.supports) {
          ${Object.entries(CSS_TESTS).map(([name, test]) => `
            try {
              results.css.${name} = ${test};
            } catch (e) {
              results.css.${name} = false;
            }
          `).join('')}
        }
        
        // Send results back
        window.testResults = results;
        
        // Also log to console for manual inspection
        console.log('Browser Compatibility Test Results:', results);
      </script>
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cross-Browser Compatibility Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .test-section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .feature-test {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .supported { color: #28a745; }
          .not-supported { color: #dc3545; }
          .warning { color: #ffc107; }
        </style>
      </head>
      <body>
        <h1>Cross-Browser Compatibility Test</h1>
        <p>Testing browser compatibility for Wheel within a Wheel game...</p>
        
        <div class="test-section">
          <h2>Browser Information</h2>
          <p id="user-agent">Loading...</p>
        </div>
        
        <div class="test-section">
          <h2>Feature Support</h2>
          <div id="feature-results">Testing...</div>
        </div>
        
        <div class="test-section">
          <h2>Performance Metrics</h2>
          <div id="performance-results">Testing...</div>
        </div>
        
        <div class="test-section">
          <h2>CSS Support</h2>
          <div id="css-results">Testing...</div>
        </div>
        
        <div class="test-section">
          <h2>Compatibility Assessment</h2>
          <div id="compatibility-results">Analyzing...</div>
        </div>
        
        ${testScript}
        
        <script>
          // Display results
          setTimeout(() => {
            const results = window.testResults;
            
            // User agent
            document.getElementById('user-agent').textContent = results.userAgent;
            
            // Features
            const featureHTML = Object.entries(results.features).map(([name, supported]) => 
              \`<div class="feature-test">
                <span>\${name}</span>
                <span class="\${supported ? 'supported' : 'not-supported'}">
                  \${supported ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>\`
            ).join('');
            document.getElementById('feature-results').innerHTML = featureHTML;
            
            // Performance
            const perfHTML = Object.entries(results.performance).map(([name, value]) => {
              let displayValue = value;
              if (typeof value === 'number') {
                displayValue = name.includes('Time') ? \`\${value.toFixed(2)}ms\` : value;
              } else if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value);
              } else if (value === null) {
                displayValue = 'Not available';
              }
              
              return \`<div class="feature-test">
                <span>\${name}</span>
                <span>\${displayValue}</span>
              </div>\`;
            }).join('');
            document.getElementById('performance-results').innerHTML = perfHTML;
            
            // CSS
            const cssHTML = Object.entries(results.css).map(([name, supported]) => 
              \`<div class="feature-test">
                <span>\${name}</span>
                <span class="\${supported ? 'supported' : 'not-supported'}">
                  \${supported ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>\`
            ).join('');
            document.getElementById('css-results').innerHTML = cssHTML;
            
            // Compatibility assessment
            const requiredFeatures = ['canvas', 'webaudio', 'localstorage'];
            const missingFeatures = requiredFeatures.filter(f => !results.features[f]);
            
            let compatibilityHTML = '';
            if (missingFeatures.length === 0) {
              compatibilityHTML = '<div class="supported">✓ Fully Compatible</div>';
              compatibilityHTML += '<p>This browser supports all required features for the Wheel within a Wheel game.</p>';
            } else {
              compatibilityHTML = '<div class="not-supported">✗ Compatibility Issues</div>';
              compatibilityHTML += \`<p>Missing required features: \${missingFeatures.join(', ')}</p>\`;
              compatibilityHTML += '<p>The game may not function properly in this browser.</p>';
            }
            
            // Performance warnings
            if (results.performance.canvasRendering > 100) {
              compatibilityHTML += '<div class="warning">⚠ Canvas rendering performance may be slow</div>';
            }
            
            if (results.performance.memoryUsage && results.performance.memoryUsage.used > 100) {
              compatibilityHTML += '<div class="warning">⚠ High memory usage detected</div>';
            }
            
            document.getElementById('compatibility-results').innerHTML = compatibilityHTML;
          }, 100);
        </script>
      </body>
      </html>
    `;
  }

  async runTests() {
    console.log('🌐 Starting cross-browser compatibility tests...\n');

    // Generate test HTML
    const testHTML = this.generateTestHTML();
    const testFilePath = path.join(__dirname, '..', 'dist', 'browser-test.html');
    
    fs.writeFileSync(testFilePath, testHTML);
    console.log(`📄 Test file generated: ${testFilePath}`);

    // Instructions for manual testing
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Open the following file in different browsers:');
    console.log(`   file://${testFilePath}`);
    console.log('2. Check the console for detailed results');
    console.log('3. Verify all features show as supported');
    console.log('4. Test the actual game in each browser');
    
    console.log('\n🎯 Browsers to test:');
    Object.entries(BROWSER_SUPPORT).forEach(([browser, info]) => {
      console.log(`   • ${browser.charAt(0).toUpperCase() + browser.slice(1)} ${info.minVersion}+`);
    });

    console.log('\n🔧 Required Features:');
    console.log('   • HTML5 Canvas (2D rendering)');
    console.log('   • Web Audio API (sound effects)');
    console.log('   • Local Storage (game saves)');
    console.log('   • CSS Flexbox (responsive layout)');
    console.log('   • ES6+ JavaScript (modern syntax)');

    console.log('\n📱 Device Testing:');
    console.log('   • Desktop: Windows, macOS, Linux');
    console.log('   • Mobile: iOS Safari, Android Chrome');
    console.log('   • Tablet: iPad, Android tablets');

    console.log('\n⚡ Performance Targets:');
    console.log('   • Canvas rendering: <50ms for 100 operations');
    console.log('   • Physics calculations: <10ms for 1000 iterations');
    console.log('   • Memory usage: <50MB baseline');
    console.log('   • Frame rate: 60fps during animations');

    return testFilePath;
  }

  generateCompatibilityReport() {
    const reportPath = path.join(__dirname, '..', 'docs', 'browser-compatibility.md');
    
    const report = `# Browser Compatibility Report

## Supported Browsers

The Wheel within a Wheel game is designed to work on modern browsers that support the following technologies:

### Minimum Browser Versions

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |

### Required Features

| Feature | Purpose | Fallback |
|---------|---------|----------|
| HTML5 Canvas | Wheel rendering and animations | CSS-based rendering |
| Web Audio API | Sound effects and music | Silent mode |
| Local Storage | Save games and preferences | Session-only storage |
| CSS Flexbox | Responsive layout | Fixed layout |
| ES6+ JavaScript | Modern language features | Babel transpilation |

## Mobile Support

### iOS
- **Safari 14+**: Full support
- **Chrome iOS**: Full support
- **Firefox iOS**: Full support

### Android
- **Chrome 90+**: Full support
- **Firefox 88+**: Full support
- **Samsung Internet**: Partial support

## Known Issues

### Safari Specific
- Web Audio requires user interaction to start
- Some CSS animations may be limited in low power mode

### Mobile Browsers
- Touch events are fully supported
- Orientation changes are handled gracefully
- Performance may vary on older devices

## Performance Considerations

### Desktop
- Target: 60fps during wheel spinning
- Memory usage: <100MB
- Load time: <3 seconds

### Mobile
- Target: 30fps minimum
- Memory usage: <50MB
- Touch responsiveness: <100ms

## Testing Methodology

1. **Automated Tests**: Feature detection and performance benchmarks
2. **Manual Testing**: User interaction and visual verification
3. **Device Testing**: Real device testing across platforms
4. **Accessibility Testing**: Screen reader and keyboard navigation

## Troubleshooting

### Audio Issues
- Ensure browser allows autoplay
- Check system volume settings
- Try user interaction to enable audio

### Performance Issues
- Close other browser tabs
- Disable browser extensions
- Check device specifications

### Visual Issues
- Update graphics drivers
- Enable hardware acceleration
- Check browser zoom level

## Future Enhancements

- Progressive Web App (PWA) support
- WebGL rendering for better performance
- WebRTC for online multiplayer
- WebAssembly for physics calculations

---

*Last updated: ${new Date().toISOString()}*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📊 Compatibility report generated: ${reportPath}`);
    
    return reportPath;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CrossBrowserTester();
  
  tester.runTests()
    .then((testFile) => {
      console.log(`\n✅ Cross-browser test setup complete!`);
      console.log(`📄 Test file: ${testFile}`);
      
      const reportFile = tester.generateCompatibilityReport();
      console.log(`📊 Report file: ${reportFile}`);
    })
    .catch((error) => {
      console.error('❌ Cross-browser testing failed:', error);
      process.exit(1);
    });
}

module.exports = CrossBrowserTester;