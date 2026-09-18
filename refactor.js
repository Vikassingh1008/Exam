const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (filepath.endsWith('.jsx') || filepath.endsWith('.js')) {
      filelist.push(filepath);
    }
  });
  return filelist;
};

const srcDir = path.join(__dirname, 'frontend/src');
const files = walkSync(srcDir);

files.forEach(file => {
  if (file.includes('axiosInstance.js')) return;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  const relPath = path.relative(path.dirname(file), path.join(srcDir, 'api', 'axiosInstance')).replace(/\\/g, '/');
  const importPath = relPath.startsWith('.') ? relPath : './' + relPath;

  content = content.replace(/import axios from ['"]axios['"];?/g, `import api from '${importPath}';`);
  
  // Handle single quotes
  content = content.replace(/axios\.(get|post|put|delete|patch)\('http:\/\/localhost:5000\/api\//g, "api.$1('/");
  // Handle double quotes
  content = content.replace(/axios\.(get|post|put|delete|patch)\("http:\/\/localhost:5000\/api\//g, 'api.$1("/');
  // Handle backticks
  content = content.replace(/axios\.(get|post|put|delete|patch)\(`http:\/\/localhost:5000\/api\//g, 'api.$1(`/');
  
  // Also replace any remaining 'axios.' with 'api.' if axios is no longer imported
  // But wait, there might be `axios.create`? No, we replaced the import so we must replace usage.
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
