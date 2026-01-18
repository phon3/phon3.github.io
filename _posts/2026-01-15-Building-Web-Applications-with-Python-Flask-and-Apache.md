---
title: "Building Web Applications with Python Flask and Apache"
date: 2026-01-12
tags: [python, flask, apache, wsgi, web-development, backend, ubuntu]
author: Your Name
description: "A complete guide to deploying Python Flask web applications with Apache and mod_wsgi. Learn best practices for virtual environments, production configuration, and security."
---

# Building Web Applications with Python Flask and Apache

*Deploy production-ready Python Flask applications with Apache, mod_wsgi, and modern best practices.*

## Table of Contents

- [Introduction](#introduction)
- [What is Flask?](#what-is-flask)
- [Prerequisites](#prerequisites)
- [Understanding the Architecture](#understanding-the-architecture)
- [Python and Pip Installation](#python-and-pip-installation)
- [Virtual Environments Best Practices](#virtual-environments-best-practices)
- [Installing Flask](#installing-flask)
- [Creating Your Flask Application](#creating-your-flask-application)
- [Apache and mod_wsgi Configuration](#apache-and-modwsgi-configuration)
- [Production Deployment](#production-deployment)
- [Environment Variables and Configuration](#environment-variables-and-configuration)
- [Database Integration](#database-integration)
- [Security Best Practices](#security-best-practices)
- [Performance Optimization](#performance-optimization)
- [Logging and Monitoring](#logging-and-monitoring)
- [Troubleshooting](#troubleshooting)
- [What's Changed Since Python 2.7](#whats-changed-since-python-27)

---

## Introduction

Flask is a lightweight, powerful Python web framework that makes it easy to build web applications. Combined with Apache and mod_wsgi, Flask provides a robust platform for production-ready web services, APIs, and full-stack web applications.

**What you'll learn:**
- Modern Python 3 and Flask setup
- Virtual environment management
- Apache integration with mod_wsgi
- Production deployment strategies
- Security hardening
- Performance optimization

**By the end of this guide, you'll have:**
- Flask application running on Apache
- Proper virtual environment isolation
- Production-ready configuration
- Security best practices implemented
- Understanding of common deployment patterns

---

## What is Flask?

Flask is a micro web framework for Python that provides the essentials for web development without forcing specific tools or libraries.

### Flask vs Other Frameworks

**Flask (Micro-framework):**
- Minimal core, extensible with plugins
- Flexibility in architecture choices
- Lightweight and fast
- Great for APIs and small to medium projects

**Django (Full-stack):**
- Batteries included (ORM, admin, auth)
- Opinionated structure
- Better for large, complex applications
- Built-in admin interface

**FastAPI (Modern):**
- Async/await support
- Automatic API documentation
- Type hints and validation
- Great performance for APIs

### When to Use Flask

**Flask is ideal for:**
- RESTful APIs
- Microservices
- Small to medium web applications
- Projects requiring flexibility
- Learning web development
- Prototyping and MVPs

**Consider alternatives for:**
- Large enterprise applications (Django)
- Real-time applications (Node.js, FastAPI)
- Heavy async workloads (FastAPI)

---

## Prerequisites

### Required Setup

Before starting, ensure you have:

1. **LAMP Stack Installed** (see my LAMP setup guide)
   - Apache 2.4+
   - MySQL 8.0+ or PostgreSQL
   - SSL certificates configured

2. **Server Requirements:**
   - Ubuntu 22.04+ (or 20.04)
   - 1GB+ RAM (2GB+ recommended)
   - Root or sudo access
   - Domain name (optional but recommended)

3. **Knowledge Prerequisites:**
   - Basic Python programming
   - Understanding of web concepts (HTTP, REST)
   - Basic Linux command line
   - HTML/CSS basics (for templates)

### Verify Existing Setup

```bash
# Check Apache is running
sudo systemctl status apache2

# Check Python is available
python3 --version

# Check if you have a domain configured
ls -l /etc/apache2/sites-available/
```

---

## Understanding the Architecture

### How Flask Works with Apache

```
[User Browser]
      ↓
[Apache Web Server] (Port 80/443)
      ↓
[mod_wsgi] (Python gateway)
      ↓
[Flask Application] (Python code)
      ↓
[Database] (MySQL/PostgreSQL)
```

**Component roles:**

1. **Apache**: Handles HTTP requests, SSL, static files
2. **mod_wsgi**: Bridges Apache and Python
3. **Flask**: Application logic and routing
4. **Virtual Environment**: Isolated Python dependencies
5. **WSGI file**: Entry point for mod_wsgi

### Request Flow

1. User requests `https://example.com/api/users`
2. Apache receives the HTTPS request
3. Apache determines it's a dynamic request (not static)
4. mod_wsgi activates Python interpreter
5. WSGI file loads Flask application
6. Flask routes request to appropriate view function
7. Flask processes request, queries database if needed
8. Flask returns response (HTML, JSON, etc.)
9. mod_wsgi passes response to Apache
10. Apache sends response to user

---

## Python and Pip Installation

Modern Ubuntu comes with Python 3 pre-installed, but we'll ensure proper setup.

### Verify Python Installation

```bash
# Check available Python versions
type python3 python

# Check Python 3 version (should be 3.10+ on Ubuntu 22.04)
python3 --version
```

Expected output:
```
Python 3.10.12
```

### Install Python Development Tools

```bash
sudo apt update
sudo apt install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    libssl-dev \
    libffi-dev \
    libpq-dev \
    git
```

**Packages explained:**
- `python3-pip` - Python package installer
- `python3-dev` - Header files for compiling Python extensions
- `python3-venv` - Virtual environment support
- `build-essential` - Compilers and build tools
- `libssl-dev` - SSL library (for cryptography packages)
- `libffi-dev` - Foreign function interface library
- `libpq-dev` - PostgreSQL client library (if using PostgreSQL)

### Install Apache mod_wsgi

```bash
# For Python 3
sudo apt install libapache2-mod-wsgi-py3 -y

# Enable mod_wsgi
sudo a2enmod wsgi

# Restart Apache
sudo systemctl restart apache2
```

### Verify Installation

```bash
# Check pip version
pip3 --version

# Verify mod_wsgi is loaded
apache2ctl -M | grep wsgi
```

Should show:
```
wsgi_module (shared)
```

---

## Virtual Environments Best Practices

Virtual environments isolate project dependencies, preventing conflicts and ensuring reproducibility.

### Why Virtual Environments?

**Without virtual environments:**
```
System Python
├── Package A (v1.0) ← Project 1 needs this
├── Package A (v2.0) ← Project 2 needs this (CONFLICT!)
└── Package B (v3.0)
```

**With virtual environments:**
```
System Python
│
Project 1 (venv)
├── Package A (v1.0) ✓
└── Package B (v2.0)
│
Project 2 (venv)
├── Package A (v2.0) ✓
└── Package C (v1.0)
```

### Creating a Virtual Environment

```bash
# Navigate to your project directory
cd /var/www/example.com

# Create a virtual environment
python3 -m venv venv

# Alternative name
python3 -m venv flask_env
```

**Directory structure:**
```
/var/www/example.com/
├── venv/
│   ├── bin/
│   │   ├── activate
│   │   ├── pip
│   │   └── python
│   ├── lib/
│   └── pyvenv.cfg
└── (your flask app files)
```

### Activating and Deactivating

```bash
# Activate virtual environment
source venv/bin/activate

# Your prompt should change to show (venv)
(venv) user@server:/var/www/example.com$

# Now pip installs only affect this environment
pip install flask

# Check where packages are installed
pip show flask
# Should show: Location: /var/www/example.com/venv/lib/python3.10/site-packages

# Deactivate when done
deactivate
```

### Virtual Environment Best Practices

**DO:**
- ✅ Create one venv per project
- ✅ Add `venv/` to `.gitignore`
- ✅ Use `requirements.txt` for dependencies
- ✅ Activate venv before installing packages
- ✅ Set proper ownership for production

**DON'T:**
- ❌ Use `sudo pip install` (installs globally)
- ❌ Commit virtual environment to Git
- ❌ Share venvs between projects
- ❌ Install packages outside venv

### Requirements Management

**Create requirements.txt:**

```bash
# Activate your venv first
source venv/bin/activate

# Install your packages
pip install flask flask-sqlalchemy flask-login

# Save installed packages
pip freeze > requirements.txt
```

**Install from requirements.txt:**

```bash
# On new server or fresh environment
source venv/bin/activate
pip install -r requirements.txt
```

---

## Installing Flask

### Basic Flask Installation

```bash
# Activate virtual environment
cd /var/www/example.com
source venv/bin/activate

# Install Flask
pip install Flask

# Verify installation
python -c "import flask; print(flask.__version__)"
```

### Common Flask Extensions

```bash
# Database ORM
pip install Flask-SQLAlchemy

# User authentication
pip install Flask-Login

# Form handling
pip install Flask-WTF

# Email support
pip install Flask-Mail

# RESTful API tools
pip install Flask-RESTful

# CORS support (for APIs)
pip install Flask-CORS

# Environment variable management
pip install python-dotenv

# Database migrations
pip install Flask-Migrate

# Input validation
pip install marshmallow
```

### Verify Flask Installation

```bash
# Start Python interpreter
python

# Import Flask
>>> import flask
>>> print(flask.__version__)
3.0.0
>>> exit()
```

---

## Creating Your Flask Application

### Basic Flask Application Structure

```bash
# Create directory structure
mkdir -p /var/www/example.com/flask_app
cd /var/www/example.com/flask_app

# Create necessary directories
mkdir -p app/static/{css,js,images}
mkdir -p app/templates
mkdir instance
mkdir tests
```

**Recommended structure:**

```
flask_app/
├── venv/                    # Virtual environment
├── app/
│   ├── __init__.py         # Application factory
│   ├── models.py           # Database models
│   ├── routes.py           # URL routes
│   ├── forms.py            # WTForms
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── templates/
│       ├── base.html
│       ├── index.html
│       └── ...
├── instance/
│   └── config.py           # Instance-specific config
├── tests/
│   └── test_*.py           # Unit tests
├── config.py               # Configuration classes
├── requirements.txt        # Dependencies
├── .env                    # Environment variables (not in git!)
├── .gitignore
└── wsgi.py                 # WSGI entry point
```

### Simple Flask Application

**Create `app/__init__.py`:**

```python
from flask import Flask

def create_app(config_name='default'):
    app = Flask(__name__, instance_relative_config=True)
    
    # Load configuration
    app.config.from_object(f'config.{config_name}')
    app.config.from_pyfile('config.py', silent=True)
    
    # Register routes
    from app import routes
    app.register_blueprint(routes.bp)
    
    return app
```

**Create `app/routes.py`:**

```python
from flask import Blueprint, render_template, jsonify

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html', title='Home')

@bp.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Flask application is running'
    })

@bp.route('/about')
def about():
    return render_template('about.html', title='About')
```

**Create `config.py`:**

```python
import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///dev.db'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SECRET_KEY = os.environ.get('SECRET_KEY')  # Must be set in production!

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
```

**Create `wsgi.py` (entry point):**

```python
import os
from app import create_app

# Determine environment
env = os.environ.get('FLASK_ENV', 'production')

# Create application
app = create_app(env)

if __name__ == '__main__':
    app.run()
```

**Create basic template `app/templates/base.html`:**

{% raw %}
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Flask App{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <nav>
        <a href="{{ url_for('main.index') }}">Home</a>
        <a href="{{ url_for('main.about') }}">About</a>
    </nav>
    
    <main>
        {% block content %}{% endblock %}
    </main>
    
    <footer>
        <p>&copy; 2026 Your Company</p>
    </footer>
</body>
</html>
```
{% endraw %}

**Create `app/templates/index.html`:**

{% raw %}
```html
{% extends "base.html" %}

{% block title %}Home - {{ super() }}{% endblock %}

{% block content %}
    <h1>Welcome to Flask</h1>
    <p>Your Flask application is running successfully!</p>
{% endblock %}
```
{% endraw %}

### Test Your Application Locally

```bash
# Activate virtual environment
source venv/bin/activate

# Set environment variables
export FLASK_APP=wsgi.py
export FLASK_ENV=development

# Run development server
flask run --host=0.0.0.0 --port=5000

# Or use Python directly
python wsgi.py
```

Visit `http://localhost:5000` in your browser.

---

## Apache and mod_wsgi Configuration

### Set Proper Permissions

```bash
# Set ownership to Apache user
sudo chown -R www-data:www-data /var/www/example.com/flask_app

# Set directory permissions
sudo find /var/www/example.com/flask_app -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/example.com/flask_app -type f -exec chmod 644 {} \;

# Make virtual environment executable
sudo chmod +x /var/www/example.com/flask_app/venv/bin/*
```

### Create WSGI Configuration File

```bash
sudo nano /var/www/example.com/flask_app/wsgi_app.wsgi
```

Add:

```python
#!/usr/bin/env python3
import sys
import os
import logging

# Set up logging
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

# Add application directory to path
sys.path.insert(0, '/var/www/example.com/flask_app')

# Activate virtual environment
activate_this = '/var/www/example.com/flask_app/venv/bin/activate_this.py'

# For Python 3.3+, create activate_this.py if it doesn't exist
if not os.path.exists(activate_this):
    # Alternative: modify sys.path
    venv_path = '/var/www/example.com/flask_app/venv'
    site_packages = os.path.join(venv_path, 'lib', 'python3.10', 'site-packages')
    sys.path.insert(0, site_packages)
else:
    with open(activate_this) as file_:
        exec(file_.read(), dict(__file__=activate_this))

# Set environment variables
os.environ['FLASK_ENV'] = 'production'
os.environ['SECRET_KEY'] = 'your-secret-key-here'  # Better: use .env file

# Import application
from wsgi import app as application

# Optional: set secret key from environment
# application.secret_key = os.environ.get('SECRET_KEY')
```

**Security note:** Never commit secret keys! Use environment variables or instance config.

### Configure Apache Virtual Host

**For a new Flask-only site:**

```bash
sudo nano /etc/apache2/sites-available/flask-app.conf
```

**For existing site (add Flask):**

```bash
sudo nano /etc/apache2/sites-available/example.com-le-ssl.conf
```

**Flask-only configuration:**

```apache
<VirtualHost *:80>
    ServerName example.com
    ServerAdmin admin@example.com
    
    # Redirect to HTTPS
    Redirect permanent / https://example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName example.com
    ServerAdmin admin@example.com
    
    # SSL Configuration (added by Certbot)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
    
    # WSGI Configuration
    WSGIDaemonProcess flask_app python-home=/var/www/example.com/flask_app/venv python-path=/var/www/example.com/flask_app
    WSGIProcessGroup flask_app
    WSGIScriptAlias / /var/www/example.com/flask_app/wsgi_app.wsgi
    WSGIPassAuthorization On
    
    <Directory /var/www/example.com/flask_app>
        WSGIApplicationGroup %{GLOBAL}
        WSGIScriptReloading On
        Require all granted
    </Directory>
    
    # Static files (served by Apache, not Flask)
    Alias /static /var/www/example.com/flask_app/app/static
    <Directory /var/www/example.com/flask_app/app/static>
        Require all granted
    </Directory>
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/flask-error.log
    CustomLog ${APACHE_LOG_DIR}/flask-access.log combined
    LogLevel info
</VirtualHost>
```

**Mixed configuration (Flask + Static HTML):**

```apache
<VirtualHost *:443>
    ServerName example.com
    ServerAdmin admin@example.com
    
    DocumentRoot /var/www/example.com/public_html
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    
    # Serve static site from /public_html
    <Directory /var/www/example.com/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Flask app at /app or /api
    WSGIDaemonProcess flask_app python-home=/var/www/example.com/flask_app/venv python-path=/var/www/example.com/flask_app
    WSGIProcessGroup flask_app
    WSGIScriptAlias /app /var/www/example.com/flask_app/wsgi_app.wsgi
    
    <Directory /var/www/example.com/flask_app>
        Require all granted
    </Directory>
    
    # Flask static files
    Alias /app/static /var/www/example.com/flask_app/app/static
    <Directory /var/www/example.com/flask_app/app/static>
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/example-error.log
    CustomLog ${APACHE_LOG_DIR}/example-access.log combined
</VirtualHost>
```

**WSGI directives explained:**

- `WSGIDaemonProcess` - Creates isolated Python process
- `python-home` - Points to virtual environment
- `python-path` - Application directory
- `WSGIProcessGroup` - Associates requests with daemon process
- `WSGIScriptAlias` - Maps URL to WSGI script
- `WSGIPassAuthorization` - Passes HTTP auth headers to Flask
- `WSGIApplicationGroup %{GLOBAL}` - Single interpreter (better compatibility)

### Enable Site and Reload Apache

```bash
# Test Apache configuration
sudo apache2ctl configtest

# Enable the site
sudo a2ensite flask-app.conf

# Disable default site if needed
sudo a2dissite 000-default.conf

# Reload Apache
sudo systemctl reload apache2

# Check Apache status
sudo systemctl status apache2
```

### Test Your Deployment

Visit your domain:
```
https://example.com
https://example.com/api/health
```

---

## Production Deployment

### Environment Variables

Never hardcode secrets! Use environment variables or instance configuration.

**Create `.env` file:**

```bash
nano /var/www/example.com/flask_app/.env
```

Add:

```bash
FLASK_ENV=production
SECRET_KEY=your-very-secret-key-generate-with-python-secrets
DATABASE_URL=mysql+pymysql://user:password@localhost/dbname
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

**Secure the file:**

```bash
sudo chown www-data:www-data /var/www/example.com/flask_app/.env
sudo chmod 600 /var/www/example.com/flask_app/.env
```

**Generate secure secret key:**

```python
# In Python interpreter
import secrets
print(secrets.token_hex(32))
```

**Load environment variables in Flask:**

```python
# In app/__init__.py or config.py
from dotenv load_dotenv
import os

# Load .env file
load_dotenv()

# Access variables
SECRET_KEY = os.environ.get('SECRET_KEY')
DATABASE_URL = os.environ.get('DATABASE_URL')
```

### Instance Configuration

Instance-specific config (not in version control):

```bash
mkdir -p /var/www/example.com/flask_app/instance
nano /var/www/example.com/flask_app/instance/config.py
```

Add:

```python
import os

SECRET_KEY = os.environ.get('SECRET_KEY')
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
MAIL_SERVER = os.environ.get('MAIL_SERVER')
MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
MAIL_USE_TLS = True
MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
```

### Production Checklist

**Before deploying:**

- [ ] `DEBUG = False` in production config
- [ ] Strong `SECRET_KEY` set via environment
- [ ] Database credentials secured
- [ ] `.env` file not in version control
- [ ] Error logging configured
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] CORS configured if needed for API
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use ORM)
- [ ] XSS protection (escape user input)
- [ ] CSRF protection enabled
- [ ] Regular backups scheduled

---

## Database Integration

### SQLAlchemy with MySQL

**Install dependencies:**

```bash
source venv/bin/activate
pip install Flask-SQLAlchemy pymysql cryptography
```

**Configure database in `config.py`:**

```python
import os

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'mysql+pymysql://user:password@localhost/flask_db'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }
```

**Initialize database in `app/__init__.py`:**

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='default'):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(f'config.{config_name}')
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import models
    from app import models
    
    # Register blueprints
    from app import routes
    app.register_blueprint(routes.bp)
    
    return app
```

**Create models in `app/models.py`:**

```python
from datetime import datetime
from app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Post(db.Model):
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    author = db.relationship('User', backref='posts')
```

**Create database migrations:**

```bash
# Initialize migrations
flask db init

# Create migration
flask db migrate -m "Initial migration"

# Apply migration
flask db upgrade
```

---

## Security Best Practices

### Input Validation

```python
from flask import request, abort
from marshmallow import Schema, fields, validate, ValidationError

class UserSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))

@app.route('/register', methods=['POST'])
def register():
    schema = UserSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    # Process validated data
    # ...
```

### Password Hashing

```python
from werkzeug.security import generate_password_hash, check_password_hash

# When creating user
user.password_hash = generate_password_hash(password)

# When checking password
if check_password_hash(user.password_hash, password):
    # Password correct
    pass
```

### CSRF Protection

```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()

def create_app():
    app = Flask(__name__)
    csrf.init_app(app)
    return app
```

### Rate Limiting

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # Login logic
    pass
```

### Security Headers

Add to Apache configuration:

```apache
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
</IfModule>
```

---

## Performance Optimization

### Caching

```python
from flask_caching import Cache

cache = Cache(config={'CACHE_TYPE': 'simple'})

def create_app():
    app = Flask(__name__)
    cache.init_app(app)
    return app

@app.route('/expensive-operation')
@cache.cached(timeout=300)
def expensive_operation():
    # Time-consuming operation
    result = heavy_computation()
    return result
```

### Database Query Optimization

```python
# Bad: N+1 queries
users = User.query.all()
for user in users:
    print(user.posts)  # Separate query for each user

# Good: Eager loading
users = User.query.options(db.joinedload(User.posts)).all()
for user in users:
    print(user.posts)  # Already loaded
```

### Static File Optimization

**In Apache config:**

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Connection Pooling

Already configured in SQLAlchemy:

```python
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,        # Max connections
    'pool_recycle': 3600,   # Recycle after 1 hour
    'pool_pre_ping': True   # Verify connections before use
}
```

---

## Logging and Monitoring

### Configure Logging

**Create `app/logger.py`:**

```python
import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(app):
    if not app.debug:
        # Ensure log directory exists
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # File handler
        file_handler = RotatingFileHandler(
            'logs/flask_app.log',
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('Flask app startup')
```

**Use in `app/__init__.py`:**

```python
from app.logger import setup_logging

def create_app():
    app = Flask(__name__)
    # ... configuration ...
    setup_logging(app)
    return app
```

### Error Handling

```python
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    app.logger.error(f'Server Error: {error}')
    return render_template('500.html'), 500

@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f'Unhandled exception: {e}')
    return render_template('500.html'), 500
```

### Application Monitoring

```python
@app.before_request
def before_request():
    g.start_time = time.time()

@app.after_request
def after_request(response):
    diff = time.time() - g.start_time
    app.logger.info(f'{request.method} {request.path} - {response.status_code} - {diff:.4f}s')
    return response
```

---

## Troubleshooting

### Common Issues and Solutions

**Issue: 500 Internal Server Error**

```bash
# Check Apache error log
sudo tail -50 /var/log/apache2/flask-error.log

# Check Flask application log
sudo tail -50 /var/www/example.com/flask_app/logs/flask_app.log

# Test WSGI file directly
sudo -u www-data python3 /var/www/example.com/flask_app/wsgi_app.wsgi
```

**Issue: Module not found**

```bash
# Verify virtual environment path in WSGI config
# Ensure mod_wsgi is using correct Python

# Check Python path
sudo -u www-data /var/www/example.com/flask_app/venv/bin/python -c "import sys; print('\n'.join(sys.path))"
```

**Issue: Permission denied**

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/example.com/flask_app

# Fix permissions
sudo chmod -R 755 /var/www/example.com/flask_app
sudo chmod 600 /var/www/example.com/flask_app/.env
```

**Issue: Database connection failed**

```bash
# Test database connection
mysql -u your_user -p your_database

# Verify DATABASE_URL in .env
# Check MySQL user permissions
```

**Issue: Static files not loading**

```bash
# Verify Alias directive in Apache config
# Check static directory permissions
# Clear browser cache
# Check Apache access log for 404s
```

**Issue: Changes not reflected**

```bash
# Touch WSGI file to reload
sudo touch /var/www/example.com/flask_app/wsgi_app.wsgi

# Or restart Apache
sudo systemctl restart apache2
```

### Debug Mode (Development Only!)

**Never use in production!**

```python
# In config.py
class DevelopmentConfig(Config):
    DEBUG = True
    
# Set environment
export FLASK_ENV=development
```

---

## What's Changed Since Python 2.7

### Major Python Updates

**Python 2.7 → Python 3.11+:**

1. **Print function**: `print "text"` → `print("text")`
2. **Division**: `5/2 = 2` → `5/2 = 2.5`, `5//2 = 2`
3. **Strings**: Unicode by default
4. **Type hints**: Optional type annotations
5. **f-strings**: `f"Hello {name}"` (much better than `.format()`)

### Flask Updates

**Flask 0.x → Flask 3.0:**

1. **Application factory pattern** - Now recommended
2. **Blueprints** - Better code organization
3. **async/await support** - Flask 2.0+
4. **Improved CLI** - Better flask commands
5. **Better error handling**
6. **JSON improvements** - Built-in JSON handling

### Deployment Changes

**Then:**
- Manual pip installations
- Global package conflicts common
- `sudo pip install` everywhere
- Python 2/3 compatibility issues

**Now:**
- Virtual environments mandatory
- Better dependency management
- Clear Python 3 standard
- Modern mod_wsgi-py3 package
- Better production patterns

### Virtual Environment

**Old way (virtualenv):**
```bash
sudo pip install virtualenv
virtualenv venv
```

**New way (built-in venv):**
```bash
python3 -m venv venv
```

### Best Practices Evolution

**Old:**
- Single-file applications
- Global configuration
- Hardcoded secrets
- Basic error handling

**New:**
- Application factory pattern
- Blueprint organization
- Environment variables
- Comprehensive logging
- Type hints
- Automated testing
- CI/CD pipelines

---

## Conclusion

You now have a production-ready Flask application running on Apache with mod_wsgi!

### What You've Accomplished

✅ Modern Python 3 environment setup  
✅ Virtual environment isolation  
✅ Flask application with proper structure  
✅ Apache integration via mod_wsgi  
✅ Database connectivity  
✅ Security best practices  
✅ Performance optimization  
✅ Logging and monitoring  
✅ Production deployment configuration  

### Next Steps

**Enhance your application:**
- Add user authentication (Flask-Login)
- Implement RESTful API (Flask-RESTful)
- Add front-end framework (React, Vue)
- Implement real-time features (Flask-SocketIO)
- Add background tasks (Celery)
- Implement full-text search (Elasticsearch)

**Deployment improvements:**
- Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- Implement monitoring (Prometheus, Grafana)
- Add error tracking (Sentry)
- Configure CDN for static files
- Implement horizontal scaling
- Use Docker containers
- Deploy to cloud (AWS, Azure, DigitalOcean)

**Alternative deployment methods:**
- Gunicorn + Nginx (more common than mod_wsgi)
- Docker + Docker Compose
- Kubernetes
- Platform as a Service (Heroku, PythonAnywhere)
- Serverless (AWS Lambda, Google Cloud Functions)

### Learning Resources

- [Flask Official Documentation](https://flask.palletsprojects.com/)
- [Flask Mega-Tutorial](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world)
- [Real Python Flask Tutorials](https://realpython.com/tutorials/flask/)
- [Flask-SQLAlchemy Documentation](https://flask-sqlalchemy.palletsprojects.com/)
- [Python Web Development Guide](https://docs.python-guide.org/scenarios/web/)

### Quick Reference Commands

```bash
# Virtual environment
python3 -m venv venv
source venv/bin/activate
deactivate

# Package management
pip install -r requirements.txt
pip freeze > requirements.txt

# Flask commands
export FLASK_APP=wsgi.py
flask run
flask shell
flask db init
flask db migrate
flask db upgrade

# Apache
sudo systemctl reload apache2
sudo apache2ctl configtest
sudo a2ensite flask-app.conf

# Logs
sudo tail -f /var/log/apache2/flask-error.log
tail -f logs/flask_app.log

# Troubleshooting
sudo touch wsgi_app.wsgi  # Reload app
sudo systemctl restart apache2
```

---

*Your Flask application is ready to serve dynamic content, APIs, and full web applications!*

**Related Posts:**
- Building RESTful APIs with Flask
- Flask User Authentication Complete Guide
- Deploying Flask with Docker and Gunicorn
- Flask vs Django: Choosing the Right Framework
- Modern Python Web Development Best Practices
