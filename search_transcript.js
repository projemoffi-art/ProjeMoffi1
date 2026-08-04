const fs = require('fs');

const path = 'C:\\Users\\uveys\\.gemini\\antigravity\\brain\\3bf40db1-17d2-4f17-8291-ea9f52fa6b6f\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (const line of lines) {
    if (!line) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                const str = JSON.stringify(call.args || {});
                if (str.includes('günün sözü') || str.includes('bizimlesin') || str.includes('gnn sz')) {
                    console.log('--- MATCH IN TOOL CALL ---');
                    console.log(JSON.stringify(call.args, null, 2));
                }
            }
        }
    } catch (e) {}
}
