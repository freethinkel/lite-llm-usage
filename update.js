import * as fs from "fs";

const FOLDER = "update";
const UPDATE_URL = "https://freethinkel.dev/assets/apps/lite-llm-usage/releases/";

const main = () => {
  const packageJson = JSON.parse(fs.readFileSync("./package.json"));
  
  // Clean and create update folder
  if (fs.existsSync(FOLDER)) {
    fs.rmSync(FOLDER, { force: true, recursive: true });
  }
  fs.mkdirSync(FOLDER);

  // Copy update artifacts for both architectures
  fs.cpSync(
    "./src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Lite LLM Usage.app.tar.gz",
    `./${FOLDER}/app-aarch64.app.tar.gz`,
  );
  fs.cpSync(
    "./src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Lite LLM Usage.app.tar.gz.sig",
    `./${FOLDER}/app-aarch64.app.tar.gz.sig`,
  );
  fs.cpSync(
    "./src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Lite LLM Usage.app.tar.gz",
    `./${FOLDER}/app-x86_64.app.tar.gz`,
  );
  fs.cpSync(
    "./src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Lite LLM Usage.app.tar.gz.sig",
    `./${FOLDER}/app-x86_64.app.tar.gz.sig`,
  );

  // Generate update manifest
  const manifest = {
    version: `v${packageJson.version}`,
    notes: `Check the complete changelog at https://github.com/freethinkel/lite-llm-usage/releases/tag/v${packageJson.version}`,
    pub_date: new Date().toISOString(),
    platforms: {
      "darwin-x86_64": {
        signature: String(
          fs.readFileSync(`./${FOLDER}/app-x86_64.app.tar.gz.sig`),
        ),
        url: UPDATE_URL + "app-x86_64.app.tar.gz",
      },
      "darwin-aarch64": {
        signature: String(
          fs.readFileSync(`./${FOLDER}/app-aarch64.app.tar.gz.sig`),
        ),
        url: UPDATE_URL + "app-aarch64.app.tar.gz",
      },
    },
  };

  fs.writeFileSync(
    `./${FOLDER}/update.json`,
    JSON.stringify(manifest, null, 2),
  );

  console.log(`✅ Update manifest generated for v${packageJson.version}`);
  console.log(`📁 Update files created in ./${FOLDER}/`);
};

main();