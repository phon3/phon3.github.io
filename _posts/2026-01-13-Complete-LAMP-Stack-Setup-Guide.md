---
title: "Complete LAMP Stack Setup Guide: Apache, MySQL, PHP on Ubuntu"
date: 2026-01-12
tags: [lamp, apache, mysql, php, web-server, ubuntu, security, devops]
author: Your Name
description: "A comprehensive guide to building a production-ready LAMP stack with Apache 2.4, MySQL 8.x, PHP 8.x, SSL certificates, and security hardening on Ubuntu 22.04+."
---

# Complete LAMP Stack Setup Guide: Apache, MySQL, PHP on Ubuntu

*Build a secure, production-ready web server with the classic LAMP stack: Linux, Apache, MySQL, and PHP.*

## Table of Contents

- [Introduction](#introduction)
- [What is a LAMP Stack?](#what-is-a-lamp-stack)
- [Prerequisites](#prerequisites)
- [Initial Server Setup](#initial-server-setup)
  - [Creating a Non-Root User](#creating-a-non-root-user)
  - [SSH Key Authentication](#ssh-key-authentication)
- [Installing Apache Web Server](#installing-apache-web-server)
  - [Basic Configuration](#basic-configuration)
  - [Virtual Hosts Setup](#virtual-hosts-setup)
- [Firewall Configuration](#firewall-configuration)
- [SSL Certificate with Let's Encrypt](#ssl-certificate-with-lets-encrypt)
- [Apache Security Hardening](#apache-security-hardening)
- [Installing MySQL Database Server](#installing-mysql-database-server)
  - [Securing MySQL](#securing-mysql)
  - [User Management Best Practices](#user-management-best-practices)
- [Installing PHP](#installing-php)
  - [PHP Configuration](#php-configuration)
  - [Installing phpMyAdmin](#installing-phpmyadmin)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

---

## Introduction

The LAMP stack has been the backbone of web hosting for over two decades. Despite the rise of newer technologies, LAMP remains a powerful, stable, and well-documented solution for hosting everything from simple blogs to complex web applications.

This guide provides a complete, production-ready LAMP stack setup with modern security practices, SSL certificates, and performance optimizations.

**What you'll build:**
- Apache 2.4 web server with virtual hosts
- MySQL 8.x database server with security hardening
- PHP 8.x with optimized configuration
- Automatic SSL/TLS certificates via Let's Encrypt
- phpMyAdmin for database management
- Comprehensive security measures

**Time to complete:** 60-90 minutes

---

## What is a LAMP Stack?

**LAMP** is an acronym representing four open-source components:

- **L**inux - Operating system (Ubuntu in this guide)
- **A**pache - Web server that handles HTTP requests
- **M**ySQL - Relational database management system
- **P**HP - Server-side scripting language

**How they work together:**

1. User requests a web page via browser
2. Apache receives the request
3. If the page requires dynamic content, Apache passes it to PHP
4. PHP processes the request, queries MySQL if needed
5. PHP generates HTML and returns it to Apache
6. Apache sends the HTML to the user's browser

**Alternative stacks:**
- **LEMP** - Replace Apache with Nginx
- **MEAN** - MongoDB, Express, Angular, Node.js
- **MERN** - MongoDB, Express, React, Node.js

---

## Prerequisites

Before starting, ensure you have:

### Server Requirements

- **Ubuntu Server 22.04 LTS or later** (20.04 also works)
- **Minimum:** 1GB RAM, 1 CPU core, 10GB disk
- **Recommended:** 2GB RAM, 2 CPU cores, 20GB+ disk
- **Root or sudo access** via SSH
- **Public-facing static IPv4 address**

### Required Preparations

1. **Locales configured:**
   ```bash
   sudo dpkg-reconfigure locales
   ```
   Select `en_US.UTF-8` or your preferred locale.

2. **System updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Domain name** (optional but recommended for SSL)
   - DNS A record pointing to your server IP

### What You'll Need to Know

- Basic Linux command line operations
- Understanding of SSH
- Basic networking concepts
- Text editing (nano or vim)

---

## Initial Server Setup

### Creating a Non-Root User

Running services as root is a security risk. Always create a dedicated user.

**Step 1: Create a new user**

```bash
# SSH into your server as root
ssh root@YOUR_SERVER_IP

# Create a new user (replace 'username' with your choice)
adduser username
```

You'll be prompted for:
- **Password** - Use a strong password!
- **Full Name** - Optional (press Enter to skip)
- **Other information** - Optional (press Enter to skip)

**Step 2: Grant sudo privileges**

```bash
usermod -aG sudo username
```

**What this does:**
- `-a` = append (preserves existing groups)
- `-G` = supplementary groups
- `sudo` = grants administrative privileges

**Step 3: Test the new user**

```bash
# Switch to the new user
su - username

# Test sudo access
sudo whoami
# Output should be: root
```

**Step 4: Set strong password policies (optional but recommended)**

```bash
# Install password quality checking library
sudo apt install libpam-pwquality -y

# Edit PAM configuration
sudo nano /etc/pam.d/common-password
```

Find the line with `pam_pwquality.so` and modify it:

```
password requisite pam_pwquality.so retry=3 minlen=12 difok=3 ucredit=-1 lcredit=-1 dcredit=-1 ocredit=-1
```

**Parameters explained:**
- `retry=3` - Allow 3 attempts
- `minlen=12` - Minimum 12 characters
- `difok=3` - At least 3 characters different from old password
- `ucredit=-1` - At least 1 uppercase letter
- `lcredit=-1` - At least 1 lowercase letter
- `dcredit=-1` - At least 1 digit
- `ocredit=-1` - At least 1 special character

---

### SSH Key Authentication

SSH keys are more secure than passwords and enable convenient authentication.

**On your local machine (not the server):**

```bash
# Generate SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Or for RSA (more compatible but larger):
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy your public key to the server
ssh-copy-id username@YOUR_SERVER_IP
```

**Test SSH key authentication:**

```bash
ssh username@YOUR_SERVER_IP
# Should log in without password
```

**Disable password authentication (after verifying SSH keys work):**

```bash
sudo nano /etc/ssh/sshd_config
```

Change or add these lines:

```
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

**Important:** Test SSH access from a second terminal before logging out, to ensure you don't lock yourself out!

---

## Installing Apache Web Server

Apache HTTP Server is the world's most popular web server software.

### Basic Installation

```bash
sudo apt update
sudo apt install apache2 -y
```

### Verify Installation

```bash
# Check Apache version
apache2 -v

# Check status
sudo systemctl status apache2

# Enable Apache to start on boot
sudo systemctl enable apache2
```

### Basic Apache Commands

```bash
# Start Apache
sudo systemctl start apache2

# Stop Apache
sudo systemctl stop apache2

# Restart Apache (stops then starts)
sudo systemctl restart apache2

# Reload configuration (no downtime)
sudo systemctl reload apache2

# Check configuration syntax
sudo apache2ctl configtest
```

### Test Apache

Open your browser and visit:
```
http://YOUR_SERVER_IP
```

You should see the Apache2 Ubuntu Default Page.

---

### Basic Configuration

**Suppress ServerName warning:**

Edit the Apache configuration:

```bash
sudo nano /etc/apache2/apache2.conf
```

Add this line at the end:

```apache
ServerName YOUR_SERVER_IP
```

Or if you have a domain:

```apache
ServerName example.com
```

**Test configuration:**

```bash
sudo apache2ctl configtest
# Output should be: Syntax OK
```

**Apply changes:**

```bash
sudo systemctl reload apache2
```

### Understanding Apache Directory Structure

```
/etc/apache2/
├── apache2.conf           # Main configuration file
├── ports.conf            # Port configurations
├── sites-available/      # Available site configurations
│   ├── 000-default.conf # Default HTTP site
│   └── default-ssl.conf # Default HTTPS site
├── sites-enabled/        # Enabled sites (symlinks)
├── mods-available/       # Available modules
├── mods-enabled/         # Enabled modules (symlinks)
├── conf-available/       # Additional configurations
└── conf-enabled/         # Enabled configurations

/var/www/                 # Web root directory
└── html/                # Default document root

/var/log/apache2/         # Log files
├── access.log
└── error.log
```

---

### Virtual Hosts Setup

Virtual hosts allow you to host multiple websites on one server.

#### Step 1: Create Directory Structure

```bash
# Create directory for your site
sudo mkdir -p /var/www/example.com/public_html

# Create a simple test page
sudo nano /var/www/example.com/public_html/index.html
```

Add this HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Example.com!</title>
</head>
<body>
    <h1>Success! The example.com virtual host is working!</h1>
    <p>This is a test page for your Apache virtual host.</p>
</body>
</html>
```

#### Step 2: Set Proper Permissions

**Assign ownership:**

```bash
sudo chown -R $USER:www-data /var/www/example.com
```

**Set the setgid bit:**

This ensures new files inherit the `www-data` group:

```bash
sudo find /var/www/example.com -type d -exec chmod g+s {} \;
```

**Set directory permissions:**

```bash
sudo chmod -R 755 /var/www
```

**Permission breakdown:**
- `755` means:
  - Owner: read, write, execute (7)
  - Group: read, execute (5)
  - Others: read, execute (5)

#### Step 3: Create Virtual Host Configuration

```bash
# Copy the default configuration as a template
sudo cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/example.com.conf

# Edit the new configuration
sudo nano /etc/apache2/sites-available/example.com.conf
```

Replace the content with:

```apache
<VirtualHost *:80>
    ServerAdmin admin@example.com
    ServerName example.com
    ServerAlias www.example.com
    
    DocumentRoot /var/www/example.com/public_html
    
    <Directory /var/www/example.com/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/example.com-error.log
    CustomLog ${APACHE_LOG_DIR}/example.com-access.log combined
</VirtualHost>
```

**Configuration explained:**
- `ServerAdmin` - Email for server administrator
- `ServerName` - Primary domain name
- `ServerAlias` - Alternative domain names (www subdomain)
- `DocumentRoot` - Directory containing website files
- `Options -Indexes` - Disable directory listing (security)
- `AllowOverride All` - Enable .htaccess files
- `Require all granted` - Allow access to this directory

#### Step 4: Enable the Virtual Host

```bash
# Disable the default site
sudo a2dissite 000-default.conf

# Enable your new site
sudo a2ensite example.com.conf

# Test configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

#### Step 5: Test Your Virtual Host

Visit your domain or IP:
```
http://example.com
```

You should see your test page.

---

## Firewall Configuration

Ubuntu's UFW (Uncomplicated Firewall) provides simple firewall management.

### Basic UFW Setup

```bash
# Install UFW if not present
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Check available Apache profiles
sudo ufw app list
```

Output should show:
```
Available applications:
  Apache
  Apache Full
  Apache Secure
  OpenSSH
```

**Apache profiles explained:**
- `Apache` - Opens port 80 (HTTP only)
- `Apache Full` - Opens ports 80 and 443 (HTTP and HTTPS)
- `Apache Secure` - Opens port 443 only (HTTPS only)

### Allow Required Services

```bash
# Allow SSH (CRITICAL: Do this before enabling firewall!)
sudo ufw allow OpenSSH

# Allow Apache Full (HTTP and HTTPS)
sudo ufw allow in "Apache Full"

# Enable the firewall
sudo ufw enable
# Type 'y' when prompted
```

### Verify Firewall Status

```bash
sudo ufw status verbose
```

Expected output:
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Apache Full                ALLOW       Anywhere
```

### Additional Firewall Rules

**Allow specific ports:**

```bash
# MySQL (if allowing remote database connections)
sudo ufw allow 3306/tcp

# Custom application port
sudo ufw allow 8080/tcp
```

**Allow from specific IP:**

```bash
sudo ufw allow from 203.0.113.10 to any port 22
```

**Rate limiting SSH (prevents brute force):**

```bash
# First remove regular SSH rule if present
sudo ufw delete allow OpenSSH

# Add rate-limited rule
sudo ufw limit OpenSSH
```

---

## SSL Certificate with Let's Encrypt

Let's Encrypt provides free, automated SSL/TLS certificates.

### Install Certbot

Modern installation using snap:

```bash
# Ensure snap is installed
sudo apt install snapd -y

# Update snap
sudo snap install core
sudo snap refresh core

# Remove old certbot if present
sudo apt remove certbot -y

# Install certbot via snap
sudo snap install --classic certbot

# Create symbolic link
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Enable Required Apache Modules

```bash
sudo a2enmod ssl
sudo a2enmod headers
sudo systemctl reload apache2
```

### Obtain SSL Certificate

**Prerequisites:**
1. Your domain must resolve to your server's IP
2. Apache must be running
3. Port 80 must be accessible

**Run Certbot:**

```bash
sudo certbot --apache -d example.com -d www.example.com
```

**During the process:**
1. Enter email address (for renewal notices)
2. Agree to Terms of Service
3. Choose whether to share email with EFF
4. **Select option 2**: Redirect all HTTP to HTTPS (recommended)

**What Certbot does:**
- Obtains SSL certificate from Let's Encrypt
- Modifies Apache virtual host configuration
- Configures automatic HTTPS redirect
- Sets up automatic renewal

### Verify SSL Certificate

Visit your domain:
```
https://example.com
```

You should see a padlock icon in the browser.

**Check certificate details:**

```bash
sudo certbot certificates
```

### Test Auto-Renewal

Certificates expire after 90 days. Certbot automatically renews them.

**Test renewal process:**

```bash
sudo certbot renew --dry-run
```

If successful, automatic renewal is configured.

**Manual renewal (usually not needed):**

```bash
sudo certbot renew
```

### Certificate Files Location

```
/etc/letsencrypt/
├── live/
│   └── example.com/
│       ├── fullchain.pem    # Certificate + intermediate
│       ├── privkey.pem      # Private key
│       ├── cert.pem         # Certificate only
│       └── chain.pem        # Intermediate certificate
└── renewal/
    └── example.com.conf     # Renewal configuration
```

---

## Apache Security Hardening

### Disable Server Signature

Hiding Apache version information reduces information disclosure:

```bash
sudo nano /etc/apache2/conf-available/security.conf
```

Change these lines:

```apache
ServerTokens Prod
ServerSignature Off
```

Enable the configuration:

```bash
sudo a2enconf security
sudo systemctl reload apache2
```

### Protect Against Logjam Attack

The Logjam attack targets the Diffie-Hellman key exchange. Generate strong DH parameters:

**Create DH parameters directory:**

```bash
sudo mkdir -p /etc/ssl/private
sudo chmod 710 /etc/ssl/private
```

**Generate DH parameters (this takes time):**

```bash
cd /etc/ssl/private
sudo openssl dhparam -out dhparams.pem 2048
sudo chmod 600 dhparams.pem
```

**Configure Apache SSL:**

```bash
sudo nano /etc/apache2/mods-available/ssl.conf
```

Find the SSL configuration section and update:

```apache
SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384
SSLHonorCipherOrder on
SSLCompression off
SSLSessionTickets off

# OCSP Stapling
SSLUseStapling on
SSLStaplingCache "shmcb:logs/stapling-cache(150000)"

# Add DH parameters
SSLOpenSSLConfCmd DHParameters "/etc/ssl/private/dhparams.pem"
```

### Protect Against HTTPoxy Vulnerability

Enable headers module and create protection:

```bash
# Enable headers module
sudo a2enmod headers

# Create configuration file
sudo nano /etc/apache2/conf-available/httpoxy.conf
```

Add:

```apache
<IfModule mod_headers.c>
    RequestHeader unset Proxy early
</IfModule>
```

Enable and reload:

```bash
sudo a2enconf httpoxy
sudo systemctl reload apache2
```

### Security Headers

Create a security headers configuration:

```bash
sudo nano /etc/apache2/conf-available/security-headers.conf
```

Add:

```apache
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header always set X-Frame-Options "SAMEORIGIN"
    
    # Prevent MIME type sniffing
    Header always set X-Content-Type-Options "nosniff"
    
    # Enable XSS filter
    Header always set X-XSS-Protection "1; mode=block"
    
    # Referrer policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy (adjust as needed)
    Header always set Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    
    # HSTS (only for HTTPS)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
```

Enable:

```bash
sudo a2enconf security-headers
sudo systemctl reload apache2
```

### Disable Directory Listing

Prevent users from seeing directory contents:

```bash
sudo nano /etc/apache2/apache2.conf
```

Find `<Directory /var/www/>` and ensure it has:

```apache
<Directory /var/www/>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

### Hide Sensitive Files

Create `.htaccess` protection:

```bash
sudo nano /var/www/example.com/public_html/.htaccess
```

Add:

```apache
# Deny access to hidden files
<FilesMatch "^\.">
    Require all denied
</FilesMatch>

# Protect sensitive files
<FilesMatch "(^#.*#|\.(bak|conf|dist|fla|in[ci]|log|orig|psd|sh|sql|sw[op])|~)$">
    Require all denied
</FilesMatch>
```

---

## Installing MySQL Database Server

MySQL is a powerful relational database management system.

### Install MySQL

```bash
sudo apt update
sudo apt install mysql-server -y
```

### Start and Enable MySQL

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
sudo systemctl status mysql
```

---

### Securing MySQL

**Run the security script:**

```bash
sudo mysql_secure_installation
```

**You'll be prompted for:**

1. **VALIDATE PASSWORD component** - Choose Yes
   - Level 0 (Low): Length >= 8
   - Level 1 (Medium): Length >= 8, mixed case, numbers, special chars
   - Level 2 (Strong): Above + dictionary check
   - **Recommended**: Level 1 or 2

2. **Set root password** - Enter a strong password

3. **Remove anonymous users** - Choose Yes

4. **Disallow root login remotely** - Choose Yes

5. **Remove test database** - Choose Yes

6. **Reload privilege tables** - Choose Yes

### Initial MySQL Configuration

**Access MySQL:**

```bash
sudo mysql -u root -p
```

**Check authentication method:**

```sql
SELECT user, host, plugin FROM mysql.user;
```

**Modern MySQL uses `auth_socket` for root by default, which is secure but requires sudo. If you need password authentication:**

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_strong_password';
FLUSH PRIVILEGES;
EXIT;
```

**Note:** Using `auth_socket` (default) is more secure for local access.

---

### User Management Best Practices

Never use root for applications. Create dedicated users for each application.

#### Create a Database and User

```sql
-- Log into MySQL
sudo mysql -u root -p

-- Create a database
CREATE DATABASE exampledb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a user with password
CREATE USER 'exampleuser'@'localhost' IDENTIFIED BY 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON exampledb.* TO 'exampleuser'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify grants
SHOW GRANTS FOR 'exampleuser'@'localhost';

-- Exit
EXIT;
```

#### Principle of Least Privilege

Grant only necessary permissions:

```sql
-- Read-only access
GRANT SELECT ON exampledb.* TO 'readonly_user'@'localhost';

-- Specific operations
GRANT SELECT, INSERT, UPDATE ON exampledb.* TO 'app_user'@'localhost';

-- All privileges except GRANT
GRANT ALL PRIVILEGES ON exampledb.* TO 'admin_user'@'localhost';

-- Revoke permissions
REVOKE UPDATE ON exampledb.* FROM 'app_user'@'localhost';
```

#### Remote Access (Use with Caution)

**Only if absolutely necessary:**

```sql
-- Create user that can connect from specific IP
CREATE USER 'remote_user'@'203.0.113.10' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT ON exampledb.* TO 'remote_user'@'203.0.113.10';
FLUSH PRIVILEGES;
```

**Configure MySQL to listen on external interface:**

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Change:
```
bind-address = 127.0.0.1
```

To:
```
bind-address = 0.0.0.0
```

**Add firewall rule:**

```bash
sudo ufw allow from 203.0.113.10 to any port 3306
```

**Restart MySQL:**

```bash
sudo systemctl restart mysql
```

### Rename Root User (Optional Security)

```sql
RENAME USER 'root'@'localhost' TO 'admin_root'@'localhost';
FLUSH PRIVILEGES;
```

Remember to use the new username:

```bash
sudo mysql -u admin_root -p
```

---

## Installing PHP

PHP is the scripting language that powers dynamic web applications.

### Install PHP and Extensions

```bash
# Install PHP and common extensions
sudo apt install -y \
    php \
    libapache2-mod-php \
    php-mysql \
    php-cli \
    php-common \
    php-mbstring \
    php-gd \
    php-intl \
    php-xml \
    php-zip \
    php-curl \
    php-bcmath \
    php-json \
    php-soap
```

**Essential extensions explained:**
- `libapache2-mod-php` - Apache module for PHP
- `php-mysql` - MySQL database support
- `php-cli` - Command line interface
- `php-mbstring` - Multibyte string handling
- `php-gd` - Image manipulation
- `php-xml` - XML processing
- `php-curl` - HTTP requests
- `php-zip` - ZIP file handling

### Verify PHP Installation

```bash
php -v
```

Expected output:
```
PHP 8.1.x (cli) (built: ...)
```

### Configure Apache to Prefer PHP

```bash
sudo nano /etc/apache2/mods-enabled/dir.conf
```

Move `index.php` to the first position:

**Before:**
```apache
<IfModule mod_dir.c>
    DirectoryIndex index.html index.cgi index.pl index.php index.xhtml index.htm
</IfModule>
```

**After:**
```apache
<IfModule mod_dir.c>
    DirectoryIndex index.php index.html index.cgi index.pl index.xhtml index.htm
</IfModule>
```

**Reload Apache:**

```bash
sudo systemctl reload apache2
```

### Test PHP Processing

Create a PHP info page:

```bash
sudo nano /var/www/example.com/public_html/info.php
```

Add:

```php
<?php
phpinfo();
?>
```

Visit:
```
http://example.com/info.php
```

You should see a PHP information page.

**Security:** Delete this file after testing:
```bash
sudo rm /var/www/example.com/public_html/info.php
```

---

### PHP Configuration

**Main PHP configuration file:**
```
/etc/php/8.1/apache2/php.ini
```

#### Recommended PHP Settings

```bash
sudo nano /etc/php/8.1/apache2/php.ini
```

**Important settings to adjust:**

```ini
; Maximum execution time (seconds)
max_execution_time = 300

; Maximum memory per script
memory_limit = 256M

; Maximum POST data size
post_max_size = 64M

; Maximum upload file size
upload_max_filesize = 64M

; Maximum number of files per upload
max_file_uploads = 20

; Display errors (disable in production!)
display_errors = Off
display_startup_errors = Off

; Log errors
log_errors = On
error_log = /var/log/php/error.log

; Timezone
date.timezone = America/New_York

; Session security
session.cookie_httponly = 1
session.use_strict_mode = 1
session.cookie_secure = 1  ; Only if using HTTPS
```

**Create PHP error log directory:**

```bash
sudo mkdir /var/log/php
sudo chown www-data:www-data /var/log/php
```

**Apply changes:**

```bash
sudo systemctl reload apache2
```

---

### Installing phpMyAdmin

phpMyAdmin provides a web-based MySQL management interface.

#### Install phpMyAdmin

```bash
sudo apt update
sudo apt install phpmyadmin php-mbstring php-zip php-gd php-json php-curl -y
```

**During installation:**
1. **Web server:** Select **apache2** (use Space to select, Tab to OK)
2. **Configure database:** Select **Yes**
3. **Database password:** Enter and confirm a strong password

#### Enable PHP Extensions

```bash
sudo phpenmod mbstring
sudo systemctl reload apache2
```

#### Configure Apache for phpMyAdmin

**The installer should automatically configure Apache, but verify:**

```bash
# Check if configuration exists
ls -l /etc/apache2/conf-enabled/phpmyadmin.conf

# If missing, enable it manually
sudo ln -s /etc/apache2/conf-available/phpmyadmin.conf /etc/apache2/conf-enabled/phpmyadmin.conf
sudo systemctl reload apache2
```

#### Access phpMyAdmin

Visit:
```
https://example.com/phpmyadmin
```

**Login credentials:**
- Username: `root` (or your MySQL admin user)
- Password: Your MySQL root password

---

#### Securing phpMyAdmin

phpMyAdmin is a common attack target. Implement these security measures:

**1. Change Access URL**

```bash
sudo nano /etc/apache2/conf-available/phpmyadmin.conf
```

Change the alias:

```apache
Alias /secretadmin /usr/share/phpmyadmin
```

Reload Apache:

```bash
sudo systemctl reload apache2
```

Now access via: `https://example.com/secretadmin`

**2. Enable .htaccess Protection**

```bash
sudo nano /etc/apache2/conf-available/phpmyadmin.conf
```

Add `AllowOverride All` to the Directory block:

```apache
<Directory /usr/share/phpmyadmin>
    Options FollowSymLinks
    DirectoryIndex index.php
    AllowOverride All
    # ... existing configuration ...
</Directory>
```

**Create .htaccess file:**

```bash
sudo nano /usr/share/phpmyadmin/.htaccess
```

Add:

```apache
AuthType Basic
AuthName "Restricted Access"
AuthUserFile /etc/phpmyadmin/.htpasswd
Require valid-user
```

**Create password file:**

```bash
sudo htpasswd -c /etc/phpmyadmin/.htpasswd admin
```

Enter a password when prompted.

**Reload Apache:**

```bash
sudo systemctl reload apache2
```

**3. Restrict Access by IP (Optional)**

```bash
sudo nano /etc/apache2/conf-available/phpmyadmin.conf
```

Add inside the `<Directory>` block:

```apache
<RequireAny>
    Require ip YOUR_IP_ADDRESS
    Require ip 192.168.1.0/24
</RequireAny>
```

#### Troubleshooting phpMyAdmin

**Issue: Database tables missing**

Create the phpMyAdmin configuration storage:

```bash
sudo mysql -u root -p < /usr/share/phpmyadmin/sql/create_tables.sql
```

**Create phpMyAdmin control user:**

```sql
sudo mysql -u root -p

CREATE USER 'pma'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON phpmyadmin.* TO 'pma'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Update phpMyAdmin config:**

```bash
sudo nano /etc/phpmyadmin/config.inc.php
```

Add or update:

```php
$cfg['Servers'][$i]['controluser'] = 'pma';
$cfg['Servers'][$i]['controlpass'] = 'strong_password_here';
```

---

## Performance Optimization

### Enable Apache Modules

```bash
# Enable compression
sudo a2enmod deflate

# Enable caching
sudo a2enmod expires
sudo a2enmod headers

# Enable HTTP/2 (requires Apache 2.4.17+)
sudo a2enmod http2

# Reload Apache
sudo systemctl reload apache2
```

### Configure Compression

```bash
sudo nano /etc/apache2/mods-available/deflate.conf
```

Add:

```apache
<IfModule mod_deflate.c>
    # Compress HTML, CSS, JavaScript, Text, XML, fonts
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/font-woff
    AddOutputFilterByType DEFLATE application/font-woff2
    AddOutputFilterByType DEFLATE image/svg+xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/xml
</IfModule>
```

### Configure Browser Caching

```bash
sudo nano /etc/apache2/mods-available/expires.conf
```

Add:

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Images
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    
    # Fonts
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    
    # Default
    ExpiresDefault "access plus 2 days"
</IfModule>
```

### Enable HTTP/2

```bash
sudo a2enmod http2

# Add to your SSL virtual host
sudo nano /etc/apache2/sites-available/example.com-le-ssl.conf
```

Add after the `<VirtualHost>` opening tag:

```apache
Protocols h2 http/1.1
```

### PHP Opcode Cache

PHP comes with OPcache built-in. Verify it's enabled:

```bash
php -i | grep opcache.enable
```

Configure OPcache:

```bash
sudo nano /etc/php/8.1/apache2/conf.d/10-opcache.ini
```

Recommended settings:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
```

### MySQL Performance Tuning

Install MySQL Tuner:

```bash
sudo apt install mysqltuner -y
```

**Run MySQL Tuner:**

```bash
sudo mysqltuner
```

Follow its recommendations for optimizing MySQL.

**Common MySQL optimizations:**

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add or adjust:

```ini
[mysqld]
# InnoDB settings
innodb_buffer_pool_size = 512M  # 70-80% of RAM for dedicated DB server
innodb_log_file_size = 128M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Query cache (deprecated in MySQL 8.0+)
# query_cache_type = 1
# query_cache_size = 64M

# Connection settings
max_connections = 200
thread_cache_size = 8

# Buffer settings
key_buffer_size = 32M
sort_buffer_size = 2M
read_buffer_size = 2M
```

**Restart MySQL:**

```bash
sudo systemctl restart mysql
```

---

## Monitoring and Maintenance

### Log Files

**Apache logs:**

```bash
# Access log
sudo tail -f /var/log/apache2/access.log

# Error log
sudo tail -f /var/log/apache2/error.log

# Virtual host specific
sudo tail -f /var/log/apache2/example.com-access.log
```

**MySQL logs:**

```bash
# Error log
sudo tail -f /var/log/mysql/error.log

# Slow query log (if enabled)
sudo tail -f /var/log/mysql/mysql-slow.log
```

**PHP logs:**

```bash
sudo tail -f /var/log/php/error.log
```

### Monitoring Tools

**Install monitoring tools:**

```bash
# System monitoring
sudo apt install htop -y

# Apache monitoring
sudo apt install apache2-utils -y

# Network monitoring
sudo apt install iftop -y
```

**Check Apache status:**

```bash
sudo apache2ctl status
```

**View current connections:**

```bash
sudo netstat -plant | grep :80
sudo netstat -plant | grep :443
```

### Regular Maintenance Tasks

**Update system weekly:**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

**Check disk space:**

```bash
df -h
```

**Check log file sizes:**

```bash
sudo du -sh /var/log/apache2/*
sudo du -sh /var/log/mysql/*
```

**Rotate logs manually if needed:**

```bash
sudo logrotate -f /etc/logrotate.conf
```

### Automated Backups

**Backup script example:**

```bash
sudo nano /usr/local/bin/backup-lamp.sh
```

Add:

```bash
#!/bin/bash

# Variables
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="root"
MYSQL_PASS="your_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup databases
mysqldump -u $MYSQL_USER -p$MYSQL_PASS --all-databases | gzip > $BACKUP_DIR/mysql_$DATE.sql.gz

# Backup web files
tar -czf $BACKUP_DIR/www_$DATE.tar.gz /var/www

# Backup Apache configs
tar -czf $BACKUP_DIR/apache_$DATE.tar.gz /etc/apache2

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Make executable:**

```bash
sudo chmod +x /usr/local/bin/backup-lamp.sh
```

**Schedule with cron:**

```bash
sudo crontab -e
```

Add:

```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-lamp.sh >> /var/log/backup.log 2>&1
```

---

## Troubleshooting

### Common Apache Issues

**Issue: Port 80/443 already in use**

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting service or kill process
sudo systemctl stop nginx  # Example: if Nginx is running
```

**Issue: "Permission denied" errors**

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/example.com

# Fix permissions
sudo find /var/www/example.com -type d -exec chmod 755 {} \;
sudo find /var/www/example.com -type f -exec chmod 644 {} \;
```

**Issue: .htaccess not working**

Ensure `AllowOverride All` is set in your virtual host configuration.

**Issue: Apache won't start**

```bash
# Check syntax
sudo apache2ctl configtest

# Check error log
sudo tail -50 /var/log/apache2/error.log

# Check status
sudo systemctl status apache2
```

### Common MySQL Issues

**Issue: Can't connect to MySQL**

```bash
# Verify MySQL is running
sudo systemctl status mysql

# Check MySQL error log
sudo tail -50 /var/log/mysql/error.log

# Test connection
mysql -u root -p
```

**Issue: "Access denied" errors**

```bash
# Reset root password
sudo mysql

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

**Issue: MySQL using too much memory**

Adjust `innodb_buffer_pool_size` in `/etc/mysql/mysql.conf.d/mysqld.cnf`.

### Common PHP Issues

**Issue: PHP not processing, showing code**

```bash
# Ensure mod_php is enabled
sudo a2enmod php8.1

# Restart Apache
sudo systemctl restart apache2
```

**Issue: "Upload failed" errors**

Check PHP upload settings in `php.ini`:
- `upload_max_filesize`
- `post_max_size`
- `memory_limit`
- `max_execution_time`

**Issue: PHP errors not showing**

```bash
# Temporarily enable display_errors for debugging
sudo nano /etc/php/8.1/apache2/php.ini
```

Change:
```ini
display_errors = On
```

**Remember to disable after debugging!**

### Performance Issues

**Check resource usage:**

```bash
# Overall system
htop

# Apache processes
ps aux | grep apache2

# MySQL processes
ps aux | grep mysql

# Disk I/O
iostat -x 1
```

**Analyze slow queries:**

Enable MySQL slow query log:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add:

```ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
```

### Security Issues

**Check for failed login attempts:**

```bash
sudo grep "Failed password" /var/log/auth.log | tail -20
```

**Check Apache access log for suspicious activity:**

```bash
sudo tail -100 /var/log/apache2/access.log | grep -E "(404|403|500)"
```

**Scan for malware (optional):**

```bash
sudo apt install clamav clamav-daemon -y
sudo freshclam
sudo clamscan -r /var/www
```

---

## What's Changed Since the Original Guide

If you're familiar with older LAMP setups, here are the major updates:

### Technology Versions

**Then (circa 2016):**
- Ubuntu 16.04
- Apache 2.4.18
- MySQL 5.7
- PHP 7.0

**Now (2026):**
- Ubuntu 22.04+
- Apache 2.4.52+
- MySQL 8.0+
- PHP 8.1+

### Key Changes

**PHP Evolution:**
- PHP 7.0 → PHP 8.1+
- Improved performance (JIT compiler in PHP 8)
- Type declarations and error handling improvements
- Deprecated functions removed

**MySQL Changes:**
- Authentication plugin changes
- `mysql_native_password` → `caching_sha2_password`
- InnoDB now default storage engine
- JSON data type support
- Window functions

**Apache Improvements:**
- HTTP/2 support
- Better performance with event MPM
- Improved SSL/TLS configuration

**Certbot Installation:**
- Old: PPA repository
- New: Snap package (easier, auto-updates)

**Security Practices:**
- Stronger cipher suites
- TLS 1.3 support
- Modern security headers
- Better password policies

**System Management:**
- Systemd everywhere
- Improved firewall (UFW) defaults
- Better package management

---

## Conclusion

You now have a fully functional, secure LAMP stack capable of hosting production websites and web applications!

### What You've Accomplished

✅ Secure Ubuntu server with proper user management  
✅ Apache web server with virtual hosts  
✅ SSL/TLS certificates with auto-renewal  
✅ MySQL database server with security hardening  
✅ PHP 8.x with optimized configuration  
✅ phpMyAdmin for database management  
✅ Comprehensive security measures  
✅ Performance optimizations  
✅ Monitoring and maintenance procedures  

### Next Steps

**For Development:**
- Install Composer (PHP package manager)
- Set up Git for version control
- Configure development tools (Xdebug, etc.)

**For Production:**
- Implement regular backups
- Set up monitoring (Nagios, Zabbix)
- Configure CDN (Cloudflare)
- Implement fail2ban for intrusion prevention
- Set up log aggregation (ELK stack)

**Popular Applications to Deploy:**
- WordPress (CMS)
- Laravel (PHP framework)
- Magento (E-commerce)
- Drupal (CMS)
- PrestaShop (E-commerce)

### Learning Resources

- [Apache Documentation](https://httpd.apache.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [PHP Manual](https://www.php.net/manual/en/)
- [Digital Ocean Community Tutorials](https://www.digitalocean.com/community/tutorials)
- [Stack Overflow LAMP Tag](https://stackoverflow.com/questions/tagged/lamp)

### Quick Reference Commands

```bash
# Apache
sudo systemctl restart apache2
sudo apache2ctl configtest
sudo a2ensite example.com.conf
sudo a2dissite 000-default.conf
sudo a2enmod rewrite

# MySQL
sudo systemctl restart mysql
sudo mysql -u root -p
sudo mysqltuner

# PHP
php -v
php -i | grep opcache

# Logs
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/mysql/error.log

# Firewall
sudo ufw status verbose
sudo ufw allow 80/tcp

# SSL
sudo certbot certificates
sudo certbot renew --dry-run
```

---

*Happy hosting! Your LAMP stack is ready to power your web applications.*

**Related Posts:**
- Deploying WordPress on LAMP Stack
- Laravel Application Setup on LAMP
- LAMP vs LEMP: Which Stack is Right for You?
- Advanced Apache Security Configuration
- MySQL Replication Setup for High Availability
