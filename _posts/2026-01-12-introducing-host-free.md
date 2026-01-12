---
title: "Introducing Host-Free: Serverless Data Storage in URLs"
date: 2026-01-12 13:40:00 -0800
categories: [Projects, Web Development]
tags: [javascript, encryption, url-shortening, serverless]
pin: true
---

## Welcome to my blog!

I'm excited to launch this new site where I'll be sharing my coding projects, technical explorations, and general technology musings.

## Featured Project: Host-Free

To kick things off, I want to introduce **Host-Free** — a fascinating project that enables completely serverless data storage and sharing using only URLs.

### What is Host-Free?

Host-Free is a web application that lets you:
- Store data directly in URLs using compression and encoding
- Encrypt sensitive data with password protection
- Share information without needing a backend server
- Create shortened URLs using services like KVdb or TinyURL

### Key Features

**📦 URL-Based Storage**
- Compresses and encodes data into URL fragments
- No server-side database required
- Works entirely client-side

**🔒 Built-in Encryption**
- AES encryption for sensitive data
- Password-protected pages
- Everything encrypted before leaving your browser

**🔗 URL Shortening Integration**
- Support for multiple shortening services
- KVdb integration for persistent storage
- TinyURL support for quick links

### Try it Out

You can check out Host-Free at [/host-free/](/host-free/) - it's fully functional right here on this site!

The project demonstrates the power of modern browser APIs and creative use of URL standards to build applications that work without traditional backends.

### Technical Details

Host-Free uses:
- **LZ-String** for data compression
- **CryptoJS** for AES encryption  
- **Base64 encoding** for URL-safe data transfer
- **URL Fragment identifiers** for client-side data storage

All processing happens in your browser — no data is ever sent to a server (unless you choose to use a URL shortening service).

---

Stay tuned for more projects and technical posts. Feel free to explore the code on [GitHub](https://github.com/phon3/host-free)!
