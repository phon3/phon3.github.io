const HostFreeConfig = {
    // Modify this if you deploy to a custom domain
    basePath: window.location.origin === 'null' || window.location.protocol === 'file:'
        ? 'https://phon3.github.io/host-free/'
        : window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1)
};

/**
 * Host-Free Compression Utilities

 * Uses LZ-String for efficient URL fragment encoding.
 */

const HostFreeCompress = {
    /**
     * Compresses HTML/Text for plain host-free pages.
     * @param {string} content 
     * @returns {string} 
     */
    compressPlain: (content) => {
        return LZString.compressToEncodedURIComponent(content);
    },

    /**
     * Decompresses HTML/Text for plain host-free pages.
     * @param {string} compressed 
     * @returns {string} 
     */
    decompressPlain: (compressed) => {
        return LZString.decompressFromEncodedURIComponent(compressed);
    },

    /**
     * Compresses content into a Uint8Array for encryption.
     * @param {string} content 
     * @returns {Uint8Array}
     */
    compressForCrypto: (content) => {
        return LZString.compressToUint8Array(content);
    },

    /**
     * Decompresses content from a Uint8Array after decryption.
     * @param {Uint8Array} bytes 
     * @returns {string}
     */
    decompressFromCrypto: (bytes) => {
        return LZString.decompressFromUint8Array(bytes);
    }
};

const HostFreeShortener = {
    /**
     * Generates a random short key for storage
     * @returns {string}
     */
    generateKey: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 6; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    },

    /**
     * Stores a long URL in kvdb.io and returns the short key
     * @param {string} longUrl 
     * @returns {Promise<string>}
     */
    storeURL: async (longUrl) => {
        const key = HostFreeShortener.generateKey();
        const url = KVDBConfig.getURL(key);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: longUrl
            });

            if (!response.ok) {
                throw new Error(`kvdb.io returned ${response.status}`);
            }

            return key;
        } catch (error) {
            console.error('Failed to store URL in kvdb.io:', error);
            throw error;
        }
    },

    /**
     * Retrieves a long URL from kvdb.io using the short key
     * @param {string} key 
     * @returns {Promise<string>}
     */
    retrieveURL: async (key) => {
        const url = KVDBConfig.getURL(key);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`kvdb.io returned ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Failed to retrieve URL from kvdb.io:', error);
            throw error;
        }
    },

    /**
     * Shortens the current URL using kvdb.io storage
     */
    shortenWithKVDB: async () => {
        const longUrl = document.getElementById('plainout').value;
        if (!longUrl) {
            alert('Please generate a URL first.');
            return;
        }

        // Show loading state
        const statusEl = document.getElementById('shorten-status');
        if (statusEl) statusEl.textContent = 'Storing...';

        try {
            // Extract just the hash part (everything.html#HASH)
            const hashPart = longUrl.substring(longUrl.indexOf('#'));

            // Store in kvdb.io
            const key = await HostFreeShortener.storeURL(hashPart);

            // Build the shortened URL
            const shortUrl = HostFreeConfig.basePath + 'everything.html#' + key;

            // Display the shortened URL
            const shortOutEl = document.getElementById('shortout');
            if (shortOutEl) {
                shortOutEl.value = shortUrl;
                if (statusEl) statusEl.textContent = 'Shortened!';
            }

            console.log('Shortened URL:', shortUrl);
        } catch (error) {
            if (statusEl) statusEl.textContent = 'Error: ' + error.message;
            console.error('Shortening failed:', error);
        }
    },

    /**
     * Helper to copy long URL and open an external shortener service.
     * @param {string} provider 
     */
    shortenExternally: (provider) => {
        const longUrl = document.getElementById('plainout').value;
        if (!longUrl) {
            alert('Please generate a URL first.');
            return;
        }

        const links = {
            tinyurl: 'https://tinyurl.com/app',
            bitly: 'https://bitly.com/',
            cuttly: 'https://cutt.ly/'
        };

        if (navigator.clipboard) {
            navigator.clipboard.writeText(longUrl).then(() => {
                window.open(links[provider], '_blank');
                // Use a non-blocking way to notify the user if possible, but alert is safe for now
                console.log(`URL copied for ${provider}`);
            });
        } else {
            window.open(links[provider], '_blank');
        }
    }
};


/**
 * Main Application Logic
 */
const HostFreeApp = {
    init: () => {
        HostFreeApp.bindEvents();
        HostFreeApp.loadExamples();
    },

    bindEvents: () => {
        const pageEl = document.getElementById('page');
        if (!pageEl) return;

        // Auto-resize or other behaviors can go here
    },

    loadExamples: () => {
        const pres = ["basic-pre", "demo-pre", "image-pre", "blog-pre"];
        pres.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const html = el.innerHTML;
                el.innerHTML = "";
                el.appendChild(document.createTextNode(html));
            }
        });
    },

    preview: () => {
        const content = document.getElementById('page').value;
        const head = document.head.outerHTML;
        const fullHTML = `<!DOCTYPE html><html>${head}${content}</HTML>`;

        // Open in new window
        const previewWin = window.open("", "", "resizable=yes,scrollbars=yes,width=800,height=600");
        previewWin.document.write(fullHTML);
        previewWin.document.close();

        // Update iframe preview
        const iframe = document.getElementById('preview');
        if (iframe) {
            iframe.src = 'data:text/html;base64,' + btoa(fullHTML);
        }
    },

    makeEncrypted: () => {
        const key = document.getElementById('newkey').value;
        if (!key) {
            alert('Please set a password for encryption.');
            return;
        }

        const titleInput = document.getElementById('title').value || 'Untitled Page';
        const titleEncoded = btoa(titleInput);
        const content = document.getElementById('page').value;

        const compressed = HostFreeCompress.compressForCrypto(content);
        const encrypted = mjsCrypt.encryptUint8Array(compressed, key);

        const url = `everythingEncrypted.html#${encrypted}#${titleEncoded}`;
        HostFreeApp.displayURL(url, titleInput);
    },

    makePlain: () => {
        const content = document.getElementById('page').value;
        const compressed = HostFreeCompress.compressPlain(content);
        const title = document.getElementById('title').value || 'Untitled Page';

        const url = `everything.html#${compressed}`;
        HostFreeApp.displayURL(url, title);
    },

    displayURL: (url, title) => {
        // Use the configured base path for the final public URL
        const fullURL = HostFreeConfig.basePath + url;

        // UI Updates
        document.getElementById('hrefout').value = `<a href="${fullURL}">${title}</a>`;
        document.getElementById('redditout').value = `[${title}](${fullURL})`;
        document.getElementById('plainout').value = fullURL;

        const linkOut = document.getElementById('linkout');
        linkOut.textContent = title;
        linkOut.href = fullURL;

        const lenOut = document.getElementById('lenout');
        const pathLen = fullURL.length;
        lenOut.textContent = `Length: ${(pathLen / 1024).toFixed(2)} kB`;
        lenOut.style.color = pathLen > 8000 ? '#ce1b28' : '#555555';
    },


    copyToClipboard: (elementId) => {
        const val = document.getElementById(elementId).value;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(val).then(() => {
                alert('Copied to clipboard!');
            });
        }
    }
};

// Global entry points for HTML onclick handlers
window.preview = HostFreeApp.preview;
window.make = HostFreeApp.makeEncrypted;
window.makeplane = HostFreeApp.makePlain;

document.addEventListener('DOMContentLoaded', HostFreeApp.init);