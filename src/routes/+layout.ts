import "$lib/styles/common.css";
import { platform } from "@tauri-apps/plugin-os";

export const ssr = false;

document.body.classList.add(`platform__${platform()}`);
