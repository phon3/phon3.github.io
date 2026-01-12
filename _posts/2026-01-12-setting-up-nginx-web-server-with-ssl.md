---
title: "Complete Guide: Setting Up Nginx Web Server with SSL on Ubuntu"
date: 2026-01-12 16:00:00 -0800
tags: [nginx, web-server, ssl, letsencrypt, security, ubuntu, devops]
author: phon3
description: "A comprehensive guide to setting up a production-ready Nginx web server with automatic SSL certificates, firewall configuration, and security hardening on Ubuntu."
---

# Complete Guide: Setting Up Nginx Web Server with SSL on Ubuntu

*A production-ready setup for hosting secure websites with Nginx, Let's Encrypt SSL, and proper security configurations.*

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Initial Server Setup](#initial-server-setup)
  - [Creating a Non-Root User](#creating-a-non-root-user)
  - [Configuring Locales](#configuring-locales)
  - [System Updates](#system-updates)
- [Firewall Configuration](#firewall-configuration)
- [DNS Configuration](#dns-configuration)
- [Nginx Installation and Configuration](#nginx-installation-and-configuration)
- [SSL Certificate Setup with Let's Encrypt](#ssl-certificate-setup-with-lets-encrypt)
- [Advanced Nginx Configuration](#advanced-nginx-configuration)
- [Security Hardening](#security-hardening)
- [Nginx as a Reverse Proxy](#nginx-as-a-reverse-proxy)
- [Maintenance and Monitoring](#maintenance-and-monitoring)
- [Troubleshooting](#troubleshooting)

---

## Introduction

Nginx (pronounced "engine-x") is a high-performance web server, reverse proxy, and load balancer. It's known for its stability, rich feature set, simple configuration, and low resource consumption. This guide will walk you through setting up a production-ready Nginx server with automatic SSL/TLS certificates from Let's Encrypt.

**What you'll accomplish:**
- Set up a secure Ubuntu server with proper user management
- Install and configure Nginx
- Implement firewall rules for security
- Obtain and auto-renew free SSL certificates
- Configure Nginx as both a static web server and reverse proxy
- Implement security best practices

**Use cases covered:**
- Static website hosting
- Reverse proxy for backend applications
- Multiple domains/subdomains on one server
- Automatic HTTPS with certificate renewal

---

## Prerequisites

Before starting, ensure you have:

- **Ubuntu Server 22.04 LTS or later** (this guide works on 20.04+ with minor adjustments)
- **A public-facing static IP address** assigned to your server
- **Root or sudo access** to the server
- **A domain name** (required for SSL certificates) pointed to your server's IP
- **SSH access** to your server (see my separate guide on SSH hardening)

**Recommended server specs:**
- **Minimum:** 1GB RAM, 1 CPU core, 10GB disk
- **Recommended:** 2GB RAM, 2 CPU cores, 20GB disk

---

## Initial Server Setup

### Creating a Non-Root User

Running services as root is a security risk. Always create a dedicated user with sudo privileges.

**Step 1: Create a new user**

```bash
# Replace 'username' with your desired username
sudo adduser username
```

You'll be prompted to:
- Set a password (use a strong password!)
- Enter user information (optional, press Enter to skip)

**Step 2: Grant sudo privileges**

```bash
sudo usermod -aG sudo username
```

**What this does:**
- `-a` = append (don't remove existing groups)
- `-G` = supplementary groups
- `sudo` = the group that grants administrative privileges

**Step 3: Test the new user**

```bash
# Switch to the new user
su - username

# Test sudo access
sudo whoami
# Should output: root
```

**Step 4: Configure SSH for the new user (recommended)**

```bash
# On your local machine, copy your SSH key to the new user
ssh-copy-id username@your_server_ip

# Test SSH login
ssh username@your_server_ip
```

**Security tip:** After verifying the new user works, consider disabling root SSH login in `/etc/ssh/sshd_config`.

---

### Configuring Locales

Proper locale configuration prevents character encoding issues and warning messages.

```bash
sudo dpkg-reconfigure locales
```

**In the menu:**
1. Use arrow keys to navigate
2. Use space bar to select locales (minimum: `en_US.UTF-8`)
3. Press Tab to move to "OK" and press Enter
4. Select your default locale (usually `en_US.UTF-8`)

**Why this matters:**
- Ensures proper character display
- Prevents Perl and Python locale warnings
- Required for some applications

**Verify locale settings:**

```bash
locale
```

---

### System Updates

Always start with an updated system:

```bash
sudo apt update
sudo apt upgrade -y
```

**Install essential tools:**

```bash
sudo apt install -y \
    nano \
    vim \
    curl \
    wget \
    ufw \
    dnsutils \
    net-tools \
    git \
    htop
```

**What these do:**
- `nano/vim` - Text editors
- `curl/wget` - Download files from command line
- `ufw` - Uncomplicated Firewall (we'll configure next)
- `dnsutils` - DNS troubleshooting tools (dig, nslookup)
- `net-tools` - Network utilities (ifconfig, netstat)
- `git` - Version control (useful for config management)
- `htop` - Interactive process viewer

---

## Firewall Configuration

Ubuntu's Uncomplicated Firewall (UFW) provides an easy-to-use interface for iptables.

### Basic UFW Setup

**Set default policies:**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

**Allow essential services:**

```bash
# SSH - CRITICAL: Allow SSH before enabling firewall!
sudo ufw allow 22/tcp
# Or limit SSH to prevent brute force:
sudo ufw limit 22/tcp

# HTTP
sudo ufw allow 80/tcp

# HTTPS
sudo ufw allow 443/tcp
```

**Enable the firewall:**

```bash
sudo ufw enable
```

Type 'y' and press Enter when prompted.

**Verify firewall status:**

```bash
sudo ufw status verbose
```

Expected output:
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     LIMIT       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### UFW Best Practices

**Allow specific IP addresses (recommended for SSH):**

```bash
# Allow SSH only from your office/home IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# Then remove the general SSH rule
sudo ufw delete allow 22/tcp
```

**Common additional rules:**

```bash
# Allow ping (ICMP)
sudo ufw allow from any to any proto icmp

# Allow specific subnet
sudo ufw allow from 192.168.1.0/24

# Allow port range
sudo ufw allow 6000:6007/tcp
```

**View numbered rules (useful for deletion):**

```bash
sudo ufw status numbered
```

**Delete a rule:**

```bash
sudo ufw delete 3  # Delete rule number 3
```

---

## DNS Configuration

Before obtaining SSL certificates, your domain must correctly point to your server.

### Setting Up DNS Records

Log into your domain registrar or DNS provider (Cloudflare, Route53, etc.) and create:

**A Record (for main domain):**
- Type: `A`
- Name: `@` or leave blank
- Value: `YOUR_SERVER_IP`
- TTL: `3600` (or automatic)

**A Record (for www subdomain):**
- Type: `A`
- Name: `www`
- Value: `YOUR_SERVER_IP`
- TTL: `3600`

**Optional: IPv6 (AAAA Record):**
- Type: `AAAA`
- Name: `@`
- Value: `YOUR_IPv6_ADDRESS`

### Verify DNS Propagation

**Using dig:**

```bash
dig example.com +short
# Should return your server IP
```

**Using nslookup:**

```bash
nslookup example.com
# Should show your server IP in the answer section
```

**Using host:**

```bash
host example.com
```

**Check from multiple locations:**

Visit https://dnschecker.org and enter your domain to check global propagation.

**Note:** DNS propagation can take 0-48 hours, but usually completes within 1-2 hours.

---

## Nginx Installation and Configuration

### Remove Apache (if installed)

Nginx and Apache can conflict over port 80:

```bash
# Check if Apache is installed
dpkg -l | grep apache2

# If installed, stop and remove it
sudo systemctl stop apache2
sudo apt remove apache2 -y
sudo apt autoremove -y
```

### Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Verify Installation

```bash
# Check Nginx version
nginx -v

# Check Nginx status
sudo systemctl status nginx
```

Nginx should be active and running.

### Start, Stop, and Restart Nginx

```bash
# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx (stops then starts)
sudo systemctl restart nginx

# Reload Nginx (graceful, no downtime)
sudo systemctl reload nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Test Nginx

Visit your server IP in a browser:
```
http://YOUR_SERVER_IP
```

You should see the default Nginx welcome page.

### Understanding Nginx Directory Structure

```
/etc/nginx/
├── nginx.conf              # Main configuration file
├── sites-available/        # Available site configurations
│   └── default            # Default site
├── sites-enabled/          # Enabled site configurations (symlinks)
│   └── default -> ../sites-available/default
├── snippets/              # Reusable configuration snippets
├── conf.d/                # Additional configurations
└── modules-enabled/       # Enabled modules

/var/www/html/             # Default web root
/var/log/nginx/            # Log files
├── access.log
└── error.log
```

### Basic Site Configuration

Edit the default site configuration:

```bash
sudo nano /etc/nginx/sites-available/default
```

Replace with a basic configuration:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name example.com www.example.com;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Logging
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}
```

**Configuration explained:**
- `listen 80` - Listen on port 80 (HTTP)
- `listen [::]:80` - Listen on IPv6
- `server_name` - Your domain(s)
- `root` - Document root directory
- `index` - Default file names
- `try_files` - Try files in order, return 404 if not found

### Test Configuration Syntax

**Always test before reloading:**

```bash
sudo nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Apply Changes

```bash
sudo systemctl reload nginx
```

---

## SSL Certificate Setup with Let's Encrypt

Let's Encrypt provides free, automated SSL/TLS certificates.

### Install Certbot

Certbot is the official Let's Encrypt client.

**Modern installation method (snap):**

```bash
# Remove old certbot if installed via apt
sudo apt remove certbot

# Install snapd if not already installed
sudo apt install snapd -y

# Ensure snap is up to date
sudo snap install core
sudo snap refresh core

# Install certbot
sudo snap install --classic certbot

# Create symbolic link
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

**Why snap?** 
- Always up-to-date
- Automatic updates
- Isolated from system packages

### Obtain SSL Certificate

**Before running certbot:**
1. Ensure your domain resolves to your server IP
2. Ensure Nginx is running
3. Ensure port 80 is accessible

**Run certbot with Nginx plugin:**

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

**During the process:**
1. Enter your email (for urgent renewal and security notices)
2. Agree to Terms of Service (A)
3. Choose whether to share email with EFF (Y/N)
4. Choose redirect option:
   - Option 1: No redirect
   - **Option 2: Redirect all HTTP to HTTPS (recommended)**

**What certbot does:**
- Obtains certificates from Let's Encrypt
- Automatically modifies your Nginx configuration
- Sets up HTTPS
- Configures automatic renewal

### Verify SSL Certificate

Visit your domain in a browser:
```
https://example.com
```

You should see a padlock icon indicating a secure connection.

**Check certificate details:**

```bash
sudo certbot certificates
```

### Certificate Auto-Renewal

Certbot automatically creates a systemd timer for renewal.

**Test automatic renewal:**

```bash
sudo certbot renew --dry-run
```

If this succeeds, automatic renewal is configured correctly.

**Manual renewal (usually not needed):**

```bash
sudo certbot renew
```

**Check renewal timer:**

```bash
sudo systemctl list-timers | grep certbot
```

### Understanding Certificate Locations

```
/etc/letsencrypt/
├── live/
│   └── example.com/
│       ├── fullchain.pem  # Certificate + intermediate
│       ├── privkey.pem    # Private key
│       └── cert.pem       # Certificate only
├── renewal/
│   └── example.com.conf   # Renewal configuration
└── archive/               # Historical certificates
```

---

## Advanced Nginx Configuration

### Optimizing Nginx

Edit the main configuration:

```bash
sudo nano /etc/nginx/nginx.conf
```

**Recommended settings:**

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;  # Hide Nginx version

    # Buffer Settings
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # Include configurations
    include /etc/nginx/mime.types;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Security Headers

Create a security headers snippet:

```bash
sudo nano /etc/nginx/snippets/security-headers.conf
```

Add:

```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Include in your site configuration:

```nginx
server {
    # ... other configuration ...
    
    include snippets/security-headers.conf;
    
    # ... rest of configuration ...
}
```

### SSL Configuration Best Practices

Create an SSL snippet:

```bash
sudo nano /etc/nginx/snippets/ssl-params.conf
```

Add:

```nginx
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# SSL Session
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;
```

### Multiple Sites Configuration

Create separate configuration files for each site:

```bash
sudo nano /etc/nginx/sites-available/example.com
```

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    include snippets/ssl-params.conf;
    include snippets/security-headers.conf;

    root /var/www/example.com;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Nginx as a Reverse Proxy

Nginx excels as a reverse proxy for backend applications (Node.js, Python, etc.).

### Basic Reverse Proxy Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    
    include snippets/ssl-params.conf;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Proxy headers explained:**
- `X-Real-IP` - Original client IP
- `X-Forwarded-For` - Chain of proxies
- `X-Forwarded-Proto` - Original protocol (http/https)
- `Upgrade` & `Connection` - Required for WebSockets

### Reverse Proxy for Multiple Applications

```nginx
# Main application
location / {
    proxy_pass http://localhost:3000;
    # ... proxy headers ...
}

# API service
location /api {
    proxy_pass http://localhost:4000;
    # ... proxy headers ...
}

# Admin panel
location /admin {
    proxy_pass http://localhost:5000;
    # ... proxy headers ...
}
```

### Load Balancing

```nginx
upstream backend {
    least_conn;  # Load balancing method
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # ... SSL configuration ...

    location / {
        proxy_pass http://backend;
        # ... proxy headers ...
    }
}
```

**Load balancing methods:**
- `round_robin` (default) - Distributes requests sequentially
- `least_conn` - Sends to server with fewest connections
- `ip_hash` - Same client always goes to same server

---

## Security Hardening

### Rate Limiting

Protect against DDoS and brute force attacks:

```nginx
# In http block
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

# In server block
location / {
    limit_req zone=one burst=20 nodelay;
    # ... other configuration ...
}
```

### Block Bad Bots

Create a bot blocking file:

```bash
sudo nano /etc/nginx/snippets/block-bots.conf
```

```nginx
if ($http_user_agent ~* (bot|crawler|spider|scraper)) {
    return 403;
}
```

### Restrict Access by IP

```nginx
location /admin {
    allow 203.0.113.0/24;  # Your office network
    deny all;
    
    # ... rest of configuration ...
}
```

### Hide Sensitive Files

```nginx
# Deny access to hidden files
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# Deny access to backup files
location ~ ~$ {
    deny all;
}
```

### Fail2Ban Integration

Install and configure Fail2Ban to ban IPs with too many failed requests:

```bash
sudo apt install fail2ban -y
```

Create Nginx jail:

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 3600
```

Restart Fail2Ban:

```bash
sudo systemctl restart fail2ban
```

---

## Maintenance and Monitoring

### Log Management

**View logs in real-time:**

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log

# Both logs
sudo tail -f /var/log/nginx/*.log
```

**Log rotation:**

Nginx logs are automatically rotated by logrotate. Configuration:

```bash
sudo nano /etc/logrotate.d/nginx
```

### Performance Monitoring

**Check Nginx connections:**

```bash
sudo netstat -plant | grep nginx
```

**View active connections:**

Enable stub_status:

```nginx
server {
    listen 127.0.0.1:8080;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

Access stats:

```bash
curl http://127.0.0.1:8080/nginx_status
```

### Regular Maintenance Tasks

**Check for updates:**

```bash
sudo apt update
sudo apt upgrade nginx -y
```

**Check certificate expiration:**

```bash
sudo certbot certificates
```

**Clean old logs:**

```bash
sudo find /var/log/nginx/ -name "*.gz" -mtime +90 -delete
```

---

## Troubleshooting

### Common Issues and Solutions

**Issue: "Address already in use"**

```bash
# Check what's using port 80/443
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Kill the process or fix the conflict
```

**Issue: "Permission denied" errors**

```bash
# Check Nginx user
ps aux | grep nginx

# Fix ownership
sudo chown -R www-data:www-data /var/www/html

# Fix permissions
sudo chmod -R 755 /var/www/html
```

**Issue: SSL certificate errors**

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate files
sudo ls -la /etc/letsencrypt/live/example.com/

# Verify Nginx can read certificates
sudo nginx -t
```

**Issue: 502 Bad Gateway (reverse proxy)**

```bash
# Check if backend application is running
sudo netstat -tulpn | grep :3000

# Check SELinux (if enabled)
sudo setsebool -P httpd_can_network_connect 1

# Check logs
sudo tail -f /var/log/nginx/error.log
```

**Issue: Configuration test fails**

```bash
# Detailed syntax check
sudo nginx -t

# Check for duplicate server names
grep -r "server_name" /etc/nginx/sites-enabled/

# Validate specific file
sudo nginx -t -c /etc/nginx/sites-available/example.com
```

### Debugging Tools

**Check Nginx configuration:**

```bash
# Test configuration
sudo nginx -t

# Show configuration (parsed)
sudo nginx -T

# Check version and modules
nginx -V
```

**Test SSL configuration:**

Use SSL Labs: https://www.ssllabs.com/ssltest/

Or command line:

```bash
# Test SSL handshake
openssl s_client -connect example.com:443 -servername example.com

# Check certificate
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Monitor real-time traffic:**

```bash
# Install GoAccess
sudo apt install goaccess -y

# Analyze access log in real-time
sudo goaccess /var/log/nginx/access.log -c
```

### Emergency Recovery

**Backup configuration before changes:**

```bash
sudo cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d)
```

**Restore from backup:**

```bash
sudo rm -rf /etc/nginx
sudo cp -r /etc/nginx.backup.YYYYMMDD /etc/nginx
sudo nginx -t
sudo systemctl restart nginx
```

**Reset to default configuration:**

```bash
sudo apt remove --purge nginx nginx-common -y
sudo apt autoremove -y
sudo apt install nginx -y
```

---

## Conclusion

You now have a production-ready Nginx web server with:
- ✅ Automatic SSL/TLS certificates
- ✅ Proper firewall configuration
- ✅ Security hardening
- ✅ Reverse proxy capabilities
- ✅ Performance optimization
- ✅ Monitoring and maintenance procedures

### Key Takeaways

1. **Always test configuration** before reloading: `sudo nginx -t`
2. **Use separate config files** for each site in `/etc/nginx/sites-available/`
3. **Enable HTTPS everywhere** - Let's Encrypt makes it free and automatic
4. **Monitor your logs** regularly for security and performance issues
5. **Keep systems updated** - security patches are critical
6. **Backup configurations** before making changes

### Next Steps

**For static sites:**
- Set up automatic deployment with Git hooks
- Implement CDN for global distribution
- Configure caching strategies

**For applications:**
- Set up process managers (systemd, PM2, supervisord)
- Implement application monitoring (New Relic, Datadog)
- Configure log aggregation (ELK stack, Graylog)

**For scale:**
- Set up load balancing across multiple servers
- Implement Redis for session storage
- Configure database replication
- Use infrastructure as code (Terraform, Ansible)

### Recommended Reading

- [Official Nginx Documentation](https://nginx.org/en/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Nginx Pitfalls and Common Mistakes](https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## Quick Reference Commands

```bash
# Test configuration
sudo nginx -t

# Reload (no downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log

# Check SSL certificate
sudo certbot certificates

# Test SSL renewal
sudo certbot renew --dry-run

# View firewall status
sudo ufw status verbose

# Check open ports
sudo netstat -tulpn
```

---

*Questions or issues? The Nginx community is incredibly helpful. Check the official forums or Stack Overflow for assistance.*

**Related Posts:**
- SSH Server Hardening Guide
- Setting Up Multiple Domains on One Server
- Nginx Performance Tuning for High Traffic
- Docker + Nginx Reverse Proxy Setup
