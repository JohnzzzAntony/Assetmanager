const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../src/app/api');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(targetDir);
console.log(`Found ${files.length} files to inspect.`);

// Match any Repo call or getDashboardStats/logAssetActivity call not preceded by await
const regex = /(?<!\bawait\s+)(?:[a-zA-Z0-9_]+Repo\.[a-zA-Z0-9_]+|getDashboardStats|logAssetActivity)\(/g;

let totalFixed = 0;

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  let modified = false;

  const newContent = content.replace(regex, (matchStr) => {
    modified = true;
    totalFixed++;
    return 'await ' + matchStr;
  });

  if (modified) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed: ${path.relative(targetDir, file)}`);
  }
});

console.log(`Done! Prepend 'await' to ${totalFixed} calls.`);
