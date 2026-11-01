import fs from "node:fs";

const files = [
  "server.ts",
  "src/server/db.ts",
  "src/server/aiService.ts",
  "src/data/budgetsData.ts",
  "src/data/geoJsonSumut.ts",
  "src/data/projectsData.ts",
  "src/data/reportsData.ts",
];

const pattern = /(from\s+)(['"])(\.{1,2}\/[^'"]*?)(?:\.js)?\2/g;

let total = 0;
for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log("LEWAT (tidak ada):", f);
    continue;
  }
  const before = fs.readFileSync(f, "utf8");
  let n = 0;
  const after = before.replace(pattern, (_m, a, q, p) => {
    n++;
    return `${a}${q}${p}.js${q}`;
  });
  if (after !== before) fs.writeFileSync(f, after, "utf8");
  total += n;
  console.log(`${f}: ${n} import diperiksa`);
}
console.log("Selesai. Total import diperiksa:", total);
