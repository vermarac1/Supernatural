# Dr. Joe · Daily Scroll

Private, passphrase-locked. `index.html` holds the app encrypted (AES-GCM, PBKDF2 600k); the plain source never leaves the laptop.

Update: edit `src/app.html` (local only), run `node build.mjs`, commit `index.html`, push.
Recover the source from the live file: `node build.mjs --decrypt`.
