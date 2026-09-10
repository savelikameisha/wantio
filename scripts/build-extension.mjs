import "./build-brand-assets.mjs";
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import ts from "typescript";
const source = fs.readFileSync("src/lib/price.ts", "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
fs.writeFileSync(
  "chrome-extension/price.js",
  `// Generated from src/lib/price.ts. Run npm run build:extension.\n(function(){const exports={};\n${output}\nglobalThis.wantioParsePrice=exports.parsePrice;})();\n`,
);

fs.mkdirSync("public",{recursive:true});
const archive=path.resolve("public/wantio-extension.zip");
fs.rmSync(archive,{force:true});
execFileSync("zip",["-q","-r",archive,".","-x","*.DS_Store"],{cwd:"chrome-extension"});
