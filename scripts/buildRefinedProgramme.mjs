import fs from "node:fs";
import path from "node:path";

const refinedProgrammePath = path.resolve(
  "public/FullProgramme_10_sept_2026_updated_Final_AQ_Refined.xlsx"
);

if (!fs.existsSync(refinedProgrammePath)) {
  throw new Error(
    "Required refined programme workbook is missing: " + refinedProgrammePath
  );
}

console.log("Refined programme workbook is available.");
