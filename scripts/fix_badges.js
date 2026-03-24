const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'components', 'badges');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/const { className = '', \.\.\.rest } = props;/g, "const { className = '' } = props;");
    fs.writeFileSync(fullPath, content);
  }
});
console.log('Fixed unused rest variable in badges!');
