# Supernatural · Daily Scroll

Private, passphrase-locked. `index.html` holds the app encrypted (AES-GCM, PBKDF2 600k); `a/*.bin` are the images, encrypted with the same key. The plain source never leaves the laptop.

Update: edit `src/app.html` (local only), run `node build.mjs`, commit `index.html` and `a/`, push.
Recover the source from the live file: `node build.mjs --decrypt`.
Changing the passphrase: delete `a/` first so every image is re-encrypted with the new key.
