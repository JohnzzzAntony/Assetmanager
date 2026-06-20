const fs = require('fs');
const path = require('path');

const srcStatic = path.resolve(__dirname, '../.next/static');
const destStatic = path.resolve(__dirname, '../.next/standalone/.next/static');

const srcPublic = path.resolve(__dirname, '../public');
const destPublic = path.resolve(__dirname, '../.next/standalone/public');

try {
  if (fs.existsSync(srcStatic)) {
    fs.mkdirSync(path.dirname(destStatic), { recursive: true });
    fs.cpSync(srcStatic, destStatic, { recursive: true, force: true });
    console.log('Successfully copied .next/static to .next/standalone/.next/static');
  } else {
    console.warn('.next/static directory not found, skipping copy.');
  }
} catch (err) {
  console.error('Error copying .next/static:', err);
  process.exit(1);
}

try {
  if (fs.existsSync(srcPublic)) {
    fs.mkdirSync(path.dirname(destPublic), { recursive: true });
    fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
    console.log('Successfully copied public to .next/standalone/public');
  } else {
    console.warn('public directory not found, skipping copy.');
  }
} catch (err) {
  console.error('Error copying public:', err);
  process.exit(1);
}
