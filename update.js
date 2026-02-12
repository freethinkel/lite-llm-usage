import * as fs from "fs";
import * as path from "path";

const FOLDER = "update";
const UPDATE_URL = "https://freethinkel.dev/assets/apps/lite-llm-usage/releases/";

const TARGET_DIRS = [
  "./src-tauri/target/universal-apple-darwin/release/bundle/macos",
  "./src-tauri/target/aarch64-apple-darwin/release/bundle/macos",
  "./src-tauri/target/x86_64-apple-darwin/release/bundle/macos",
];

const findBundleDir = () => {
  for (const dir of TARGET_DIRS) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  throw new Error("Could not find bundle directory in any of the expected locations");
};

const main = () => {
  const packageJson = JSON.parse(fs.readFileSync("./package.json"));
  
  if (fs.existsSync(FOLDER)) {
    fs.rmSync(FOLDER, { force: true, recursive: true });
  }
  fs.mkdirSync(FOLDER);

  const bundleDir = findBundleDir();
  const isUniversal = bundleDir.includes("universal");
  
  console.log(`Found bundle at: ${bundleDir}`);
  console.log(`Universal binary: ${isUniversal}`);

  const appName = "Lite LLM Usage.app.tar.gz";
  const sigName = "Lite LLM Usage.app.tar.gz.sig";
  const appPath = path.join(bundleDir, appName);
  const sigPath = path.join(bundleDir, sigName);

  if (!fs.existsSync(appPath)) {
    throw new Error(`Bundle not found at ${appPath}`);
  }

  let manifest;

  if (isUniversal) {
    fs.cpSync(appPath, `./${FOLDER}/app-universal.app.tar.gz`);
    
    if (fs.existsSync(sigPath)) {
      fs.cpSync(sigPath, `./${FOLDER}/app-universal.app.tar.gz.sig`);
    }

    manifest = {
      version: `v${packageJson.version}`,
      notes: `Check the complete changelog at https://github.com/freethinkel/lite-llm-usage/releases/tag/v${packageJson.version}`,
      pub_date: new Date().toISOString(),
      platforms: {
        "darwin-x86_64": {
          signature: fs.existsSync(`./${FOLDER}/app-universal.app.tar.gz.sig`)
            ? String(fs.readFileSync(`./${FOLDER}/app-universal.app.tar.gz.sig`))
            : "",
          url: UPDATE_URL + "app-universal.app.tar.gz",
        },
        "darwin-aarch64": {
          signature: fs.existsSync(`./${FOLDER}/app-universal.app.tar.gz.sig`)
            ? String(fs.readFileSync(`./${FOLDER}/app-universal.app.tar.gz.sig`))
            : "",
          url: UPDATE_URL + "app-universal.app.tar.gz",
        },
      },
    };
  } else {
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

    manifest = {
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
  }

  fs.writeFileSync(
    `./${FOLDER}/update.json`,
    JSON.stringify(manifest, null, 2),
  );

  console.log(`✅ Update manifest generated for v${packageJson.version}`);
  console.log(`📁 Update files created in ./${FOLDER}/`);
};

main();
