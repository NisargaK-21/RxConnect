const fs = require('fs');
const s = fs.readFileSync('c:/Users/Sriraksha/Desktop/RxConnect/rx-frontend/src/app/dashboard/page.js','utf8');
const counts = { dq:0, sq:0, bt:0 };
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '"') counts.dq++;
  if (ch === "'") counts.sq++;
  if (ch === '`') counts.bt++;
}
console.log(counts);
