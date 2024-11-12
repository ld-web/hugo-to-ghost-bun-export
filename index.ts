import CliParser from "./src/CliParser";
import GhostExporter from "./src/GhostExporter";
import ImgExporter from "./src/ImgExporter";
import fs from "node:fs/promises";

// General
const DIST_DIR = "dist";
// Clean
await fs.rm(DIST_DIR, { recursive: true });

// Parse args
const { directory, targetDomain, limit, perPage } = CliParser.parse();

// Process md files
const postsExporter = new GhostExporter(directory, DIST_DIR, targetDomain);
await postsExporter.export({ limit, perPage });

// const bytes = await Bun.write(
//   `${DIST_DIR}/output.json`,
//   JSON.stringify(result)
// );
// console.log(`${bytes} bytes written`);

// Process images
// const imagesExporter = new ImgExporter(directory, DIST_DIR);
// await imagesExporter.run();

console.log("Done.");
