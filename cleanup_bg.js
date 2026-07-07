const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');

const filesToSkip = [
    'page.tsx', 
    'auth/callback/page.tsx', 
    'business-register/page.tsx',
    'reset-password/page.tsx',
    'register/page.tsx'
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            const relPath = path.relative(srcDir, fullPath).replace(/\\/g, '/');
            if (filesToSkip.includes(relPath)) {
                continue;
            }
            
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const classNameRegex = /(className=["'`])([^"'`]*min-h-screen[^"'`]*)(["'`])/g;
            
            content = content.replace(classNameRegex, (match, prefix, classString, suffix) => {
                let newClasses = classString
                    .replace(/(^|\s)bg-\[#050508\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-\[#0A0A0E\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-\[#0A0A0F\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-\[#000000\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-\[#F8F9FC\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-\[#F9FAFB\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-\[#0B0F19\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-\[#F8FAFC\](?=\s|$)/g, '')
                    .replace(/(^|\s)bg-black(?=\s|$)/g, '')
                    .replace(/(^|\s)bg-gray-50\/50(?=\s|$)/g, '')
                    .replace(/(^|\s)bg-gray-50(?=\s|$)/g, '')
                    .replace(/(^|\s)dark:bg-black(?=\s|$)/g, '')
                    .replace(/(^|\s)dark:bg-\[#121212\](?=\s|$)/g, '')
                    .replace(/(^|\s)dark:bg-\[#050505\](?=\s|$)/g, '')
                    .replace(/(^|\s)dark:bg-\[#0B0F19\](?=\s|$)/g, '')
                    .replace(/(^|\s)dark:bg-\[#000000\](?=\s|$)/g, '')
                    .replace(/(^|\s)text-white(?=\s|$)/g, '')
                    .replace(/(^|\s)text-gray-400(?=\s|$)/g, '');

                newClasses = newClasses.replace(/\s+/g, ' ').trim();
                
                if (newClasses !== classString.trim()) {
                    modified = true;
                    return prefix + newClasses + suffix;
                }
                return match;
            });

            if (modified) {
                console.log(`Updated ${relPath}`);
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDirectory(srcDir);
console.log('Cleanup completed.');
