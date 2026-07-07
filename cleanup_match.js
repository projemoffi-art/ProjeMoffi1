const fs = require('fs');
let content = fs.readFileSync('src/app/community/page.tsx', 'utf8');

// 1. Remove MATCH_CANDIDATES
content = content.replace(/const MATCH_CANDIDATES = \[[\s\S]*?\];\n/m, '');

// 2. Remove matchIndex state
content = content.replace(/[ \t]*const \[matchIndex, setMatchIndex\] = useState\(0\);\n/m, '');

// 3. Remove isMatched state
content = content.replace(/[ \t]*const \[isMatched, setIsMatched\] = useState\(false\);\n/m, '');

// 4. Remove expandedPanel === 'match'
content = content.replace(/[ \t]*{\/\* 7\. Eşleştir \(Match\) Panel \*\/}\n[\s\S]*?{\/\* 8\. Etkinlikler \(Events\) Panel \*\/}/m, "                                    {/* 8. Etkinlikler (Events) Panel */}");

// Remove the literal "match" from the expandedPanel state type definition:
content = content.replace(/ \| 'match'/g, '');

fs.writeFileSync('src/app/community/page.tsx', content);
console.log("Cleanup done.");
