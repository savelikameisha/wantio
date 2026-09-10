import fs from "node:fs";
const migrations = fs
  .readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) =>
    fs
      .readFileSync(`supabase/migrations/${f}`, "utf8")
      .replace(/^begin;\s*|^commit;\s*/gm, ""),
  );
const sql =
  "begin;\n" +
  migrations.join("\n") +
  "\n" +
  fs.readFileSync("tests/database.sql", "utf8") +
  "\nrollback;\nselect 'Migration and RLS checks passed; rolled back' as result;\n";
fs.writeFileSync(process.argv[2] || "/private/tmp/wantio-rehearsal.sql", sql);
