const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  // Create .nojekyll to bypass Jekyll processing
  fs.writeFileSync(path.join(distPath, '.nojekyll'), '');
  console.log('Created .nojekyll');

  // Copy index.html to 404.html for SPA routing support on GitHub Pages
  const indexHtml = path.join(distPath, 'index.html');
  const fourOhFourHtml = path.join(distPath, '404.html');
  
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, fourOhFourHtml);
    console.log('Copied index.html to 404.html');
  } else {
    console.error('index.html not found in dist folder');
  }
} else {
  console.error('dist folder not found. Run export first.');
}
