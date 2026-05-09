const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const start = s.indexOf('const STORY_AEGEUS_THESEUS = [');
const end = s.indexOf('const STORY_ZOO_VISIT = [');
const chunk = s.slice(start, end);
const arr = eval(chunk.replace('const STORY_AEGEUS_THESEUS = ', ''));
arr.forEach((line, i) => {
  const joined = line.segments.map((x) => x.gr).join('');
  if (joined !== line.text) {
    console.log('MISMATCH line', i, '\n  text:', line.text, '\n  join:', joined);
  }
});
console.log('done, lines', arr.length);
