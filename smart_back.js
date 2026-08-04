const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        // Match standard push to home
        const pushRegex = /onClick=\{\(\) => router\.push\(['"`]\/home['"`]\)\}/g;
        const pushReplacement = `onClick={() => { if (typeof window !== 'undefined' && window.history.length > 2) { router.back(); } else { router.push('/home'); } }}`;
        newContent = newContent.replace(pushRegex, pushReplacement);

        // Match with return statement (sometimes happens if { return router.push(...) })
        const pushRegex2 = /onClick=\{\(\) => \{ router\.push\(['"`]\/home['"`]\);? \}\}/g;
        const pushReplacement2 = `onClick={() => { if (typeof window !== 'undefined' && window.history.length > 2) { router.back(); } else { router.push('/home'); } }}`;
        newContent = newContent.replace(pushRegex2, pushReplacement2);

        // Replace for window.location.href (Fallback for Error boundaries, etc, only if they are just doing a simple push)
        const hrefRegex = /onClick=\{\(\) => window\.location\.href = ['"`]\/home['"`]\}/g;
        const hrefReplacement = `onClick={() => { if (typeof window !== 'undefined' && window.history.length > 2) { window.history.back(); } else { window.location.href = '/home'; } }}`;
        newContent = newContent.replace(hrefRegex, hrefReplacement);

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Fixed:', filePath);
        }
    }
});
