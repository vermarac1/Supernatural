// Encrypts src/app.html into index.html (the only page GitHub serves).
//   node build.mjs            build index.html
//   node build.mjs --decrypt  recover src/app.recovered.html from index.html
// Passphrase: $JB_PASS, else src/.pass (src/ is never committed).
// The salt is reused from the live index.html, so the key (and the remembered unlock on every device)
// survives rebuilds.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const { subtle } = globalThis.crypto;
const ITER = 600000;
const pass = (process.env.JB_PASS || (existsSync("src/.pass") && readFileSync("src/.pass", "utf8")) || "").trim();
if (!pass) { console.error("Set JB_PASS or create src/.pass"); process.exit(1); }

const b64 = u => Buffer.from(u).toString("base64");
const unb64 = s => Buffer.from(s, "base64");
async function key(salt) {
  const base = await subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
const live = existsSync("index.html") && readFileSync("index.html", "utf8").match(/const D = (\{.*?\});/);
const old = live && JSON.parse(live[1]);

if (process.argv.includes("--decrypt")) {
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: unb64(old.iv) }, await key(unb64(old.salt)), unb64(old.ct));
  writeFileSync("src/app.recovered.html", Buffer.from(pt));
  console.log("wrote src/app.recovered.html");
  process.exit(0);
}

const salt = old && old.iter === ITER ? unb64(old.salt) : crypto.getRandomValues(new Uint8Array(16));
const k = await key(salt);

const app = readFileSync("src/app.html", "utf8");
const pwa = app.match(/<!--pwa-->[\s\S]*?<!--\/pwa-->/)[0];
const title = app.match(/<title>.*?<\/title>/)[0];
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(app));
const D = JSON.stringify({ salt: b64(salt), iv: b64(iv), iter: ITER, ct: b64(ct) });

writeFileSync("index.html", readFileSync("shell.html", "utf8").replace("<!--pwa-->", () => pwa).replace(/<title>.*?<\/title>/, () => title).replace("__DATA__", () => D));
console.log(`index.html written (${(D.length / 1024).toFixed(0)} KB encrypted)`);
