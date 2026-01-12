# Host-Free 🛡️🌐

**Host-Free** is a lightweight, static web tool that allows you to create and share standalone web pages that exist entirely within a URL. No servers, no databases, and no hosting required.

## 🚀 How it Works

The magic of Host-Free lies in the **URL Fragment (hash)**. 

1. **Input**: You write your HTML/JS/CSS code in the generator.
2. **Compress**: The code is compressed using [LZ-String](https://pieroxy.net/lua/lz-string/) to keep the URL length manageable.
3. **Encrypt (Optional)**: Secure your content with a password using a custom symmetric encryption layer.
4. **Generate**: A unique URL is created where all your site's data lives after the `#`.
5. **Share**: Send the link anywhere. Since fragment data is never sent to the server, the site is effectively "serverless" and private.

## ✨ Features

- **Decentralized Hosting**: Your content lives in the link itself.
- **Privacy First**: Optional encryption ensures only those with the password can view the content.
- **Self-Contained**: Supports inline CSS, JS, and Base64 images for a fully "portable" site.
- **Agnostic Shortening**: Built to support multiple URL shortening patterns.

## 🛠️ Project Structure

- `index.html`: The primary generator interface.
- `hostfree.html`: An alternative generator UI with a landing page layout.
- `everything.html`: The renderer for plain (non-encrypted) host-free pages.
- `everythingEncrypted.html`: The secure renderer that handles decryption.
- `assets/js/hostfree.js`: Core logic for URL generation and management.
- `assets/js/mjsCrypt.js`: Custom symmetric encryption implementation.

## 🚦 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/phon3/host-free.git
   ```
2. Open `index.html` in any modern web browser.
3. Paste your HTML, click **"Encrypt"** or **"Run"**, and copy your generated link!

## 📜 License

This project uses the **Industrious** template by [TEMPLATED](https://templated.co), released under the Creative Commons Attribution 3.0 license. Core logic is open-source.

---
*Note: This was originally a weekend project exploring the limits of URL-based content delivery.*
