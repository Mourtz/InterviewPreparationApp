#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const sourceFiles = [
    'index.html',
    'app.js', 
    'styles.css'
];

console.log('🏗️  Building static web application...');

// Create dist directory
if (fs.existsSync(distDir)) {
    try {
        fs.rmSync(distDir, { recursive: true, force: true });
    } catch (error) {
        if (error.code === 'EBUSY' || error.code === 'ENOTEMPTY') {
            console.log('⚠️  Directory is busy, clearing files individually...');
            // Clear files individually on Windows
            const files = fs.readdirSync(distDir);
            files.forEach(file => {
                const filePath = path.join(distDir, file);
                try {
                    if (fs.statSync(filePath).isDirectory()) {
                        fs.rmSync(filePath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(filePath);
                    }
                } catch (e) {
                    console.warn(`⚠️  Could not remove ${file}: ${e.message}`);
                }
            });
        } else {
            throw error;
        }
    }
}
fs.mkdirSync(distDir, { recursive: true });

// Copy files
sourceFiles.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file}`);
    } else {
        console.warn(`⚠️  File not found: ${file}`);
    }
});

// Create a deployment README
const deploymentReadme = `# Interview Preparation App - Static Build

This is a static build of the Interview Preparation App web version.

## Deployment

This static build can be deployed to any static hosting service:

### Netlify
1. Drag and drop the \`dist\` folder to Netlify
2. Or connect your repository and set:
   - Build command: \`npm run build\`
   - Publish directory: \`dist\`

### Vercel
1. Deploy via Vercel CLI: \`vercel\`
2. Or connect your repository and set:
   - Build command: \`npm run build\`
   - Output directory: \`dist\`

### GitHub Pages
1. Copy contents of \`dist\` to your gh-pages branch
2. Or use GitHub Actions to build and deploy

### Other Static Hosts
- Firebase Hosting
- AWS S3 + CloudFront
- Azure Static Web Apps
- Surge.sh

## Configuration

Before deployment, ensure users have:
1. Valid OpenAI API key
2. Internet connection for OpenAI API calls
3. Modern browser with JavaScript enabled

## API Key Security

The OpenAI API key is stored in the browser's localStorage and never sent to the hosting server. It's only used for direct API calls to OpenAI's servers.

## Files Included

- \`index.html\` - Main application interface
- \`app.js\` - Application logic with OpenAI integration
- \`styles.css\` - Application styling
- \`README.md\` - This deployment guide

Built on: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(distDir, 'README.md'), deploymentReadme);
console.log('✅ Created deployment README.md');

// Create a simple .htaccess for Apache servers (optional)
const htaccess = `# Apache configuration for Interview Preparation App
RewriteEngine On

# Handle client-side routing (if needed in future)
RewriteBase /
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>
`;

fs.writeFileSync(path.join(distDir, '.htaccess'), htaccess);
console.log('✅ Created .htaccess for Apache servers');

// Create netlify.toml for Netlify-specific configuration
const netlifyToml = `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=3600"
`;

fs.writeFileSync(path.join(distDir, 'netlify.toml'), netlifyToml);
console.log('✅ Created netlify.toml for Netlify deployment');

// Create vercel.json for Vercel-specific configuration
const vercelJson = {
    "version": 2,
    "builds": [
        {
            "src": "package.json",
            "use": "@vercel/static-build",
            "config": {
                "distDir": "dist"
            }
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "/index.html"
        }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "X-Content-Type-Options",
                    "value": "nosniff"
                },
                {
                    "key": "X-Frame-Options", 
                    "value": "DENY"
                },
                {
                    "key": "X-XSS-Protection",
                    "value": "1; mode=block"
                }
            ]
        }
    ]
};

fs.writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(vercelJson, null, 2));
console.log('✅ Created vercel.json for Vercel deployment');

console.log('');
console.log('🎉 Static build completed successfully!');
console.log('');
console.log('📁 Files created in dist/ directory:');
console.log('   - index.html (main app)');
console.log('   - app.js (application logic)');
console.log('   - styles.css (styling)');
console.log('   - README.md (deployment guide)');
console.log('   - .htaccess (Apache config)');
console.log('   - netlify.toml (Netlify config)');
console.log('   - vercel.json (Vercel config)');
console.log('');
console.log('🚀 Ready for deployment to:');
console.log('   - Netlify (drag & drop dist/ folder)');
console.log('   - Vercel (vercel command or git integration)');
console.log('   - GitHub Pages (copy dist/ contents)');
console.log('   - Any static hosting service');
console.log('');
console.log('💡 Next steps:');
console.log('   1. Test the build locally: serve the dist/ folder');
console.log('   2. Deploy to your chosen hosting platform');
console.log('   3. Users will need their own OpenAI API keys');
