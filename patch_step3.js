const fs = require('fs');

let code = fs.readFileSync('step3_stages.js', 'utf8');

// Replace the strict string match with a robust regex match
code = code.replace(
    /const gsRefMatch = `    const scoreRef = useRef\(0\);\r?\n    const coinsRef = useRef\(0\);`;/,
    "const gsRefMatch = /const coinsRef = useRef\\(0\\);/;"
);
code = code.replace(
    /const gsRefNew = `    const scoreRef = useRef\(0\);\r?\n    const coinsRef = useRef\(0\);\r?\n    const \[stage, setStage\] = useState\(1\);`;/,
    "const gsRefNew = `const coinsRef = useRef(0);\\n    const [stage, setStage] = useState(1);`;"
);

fs.writeFileSync('step3_stages.js', code, 'utf8');
console.log('step3_stages.js patched');
