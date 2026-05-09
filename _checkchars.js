const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const idx = s.indexOf('speaker: "Αιγέας"');
const idx2 = s.indexOf('Έτσι θα κα', idx);
const t = s.slice(idx2, idx2 + 32);
console.log(t);
console.log([...t].map((c) => c.codePointAt(0).toString(16)).join(' '));
