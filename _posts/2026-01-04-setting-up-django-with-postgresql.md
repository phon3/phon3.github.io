---
title: "Setting Up Django with PostgreSQL: A Modern Guide"
date: 2026-01-04 15:30:00 -0800
tags: [django, python, postgresql, web-development, tutorial]
author: phon3
description: "A comprehensive walkthrough for setting up a Django web application with PostgreSQL database on Ubuntu. Updated for modern Django and Python 3."
---

*Originally published as a gist for Ubuntu 16.04 and Django 1.9. Updated for Ubuntu 22.04+ and Django 5.x with Python 3.*

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [System Setup](#system-setup)
- [PostgreSQL Installation and Configuration](#postgresql-installation-and-configuration)
- [Python Environment Setup](#python-environment-setup)
- [Django Installation and Project Creation](#django-installation-and-project-creation)
- [Database Configuration](#database-configuration)
- [Running Your Application](#running-your-application)
- [What's Changed Since 2016](#whats-changed-since-2016)
- [Next Steps](#next-steps)

---

## Introduction

Setting up a Django web application with PostgreSQL as the database backend is a fundamental skill for Python web developers. This guide walks you through the complete process from a fresh Ubuntu installation to a running Django application with PostgreSQL.

**What you'll learn:**
- How to install and configure PostgreSQL
- How to set up a proper Python development environment
- How to create and configure a Django project
- Best practices for database connection management
- Modern approaches using virtual environments

---

## Prerequisites

Before we begin, you'll need:

- **Ubuntu 22.04 LTS or later** (the concepts apply to most Debian-based systems)
- **Terminal access** with sudo privileges
- **Basic familiarity** with command-line operations
- **At least 4GB RAM** and 20GB disk space recommended

> **Note:** This guide assumes a fresh or relatively clean Ubuntu installation. If you're using a different Linux distribution, package names and commands may vary slightly.

---

## System Setup

### Update Your System

Always start with an up-to-date system:

```bash
sudo apt update
sudo apt upgrade -y
```

### Optional: Desktop Environment

If you're setting up a development VM and want a lightweight desktop:

```bash
# Optional: Install Xubuntu desktop
sudo apt install xubuntu-desktop

# Optional: Remove default Ubuntu desktop to save resources
sudo apt remove ubuntu-desktop
sudo apt autoremove
```

---

## PostgreSQL Installation and Configuration

### Install PostgreSQL and Dependencies

Install PostgreSQL along with the necessary development libraries:

```bash
sudo apt install postgresql postgresql-contrib libpq-dev python3-dev
```

**What gets installed:**
- `postgresql` - The database server
- `postgresql-contrib` - Additional utilities and extensions
- `libpq-dev` - PostgreSQL C library headers (needed for psycopg2)
- `python3-dev` - Python development headers (needed for compiling Python packages)

### Understanding PostgreSQL Users

During installation, PostgreSQL creates an operating system user called `postgres` which has administrative privileges. We'll use this user to set up our database.

### Create a Database User

You have two approaches:

**Option 1: Create a PostgreSQL superuser matching your OS username**

```bash
sudo -u postgres createuser -s $USER
```

This creates a PostgreSQL user with the same name as your current OS user, making subsequent commands simpler.

**Option 2: Use the postgres user directly**

```bash
sudo -u postgres psql
```

This opens the PostgreSQL interactive terminal.

### Create Your Database

**Using the command line:**

```bash
createdb -U $USER --locale=en_US.utf-8 -E utf-8 -O $USER myprojectdb -T template0
```

**Or using the PostgreSQL shell:**

```sql
CREATE DATABASE myprojectdb;
```

**Parameters explained:**
- `--locale=en_US.utf-8` - Sets the database locale
- `-E utf-8` - Sets UTF-8 encoding (supports international characters)
- `-O $USER` - Sets the database owner
- `-T template0` - Uses clean template (recommended for custom encoding)

### Create a Database User (if needed)

If you didn't create a superuser earlier, create a specific user for your project:

```sql
-- In the PostgreSQL shell (psql)
CREATE USER myprojectuser WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE myprojectdb TO myprojectuser;
```

**Security tip:** Use a strong password. Consider using a password manager to generate and store it.

### Grant Schema Privileges (Django 3.2+)

For Django 3.2 and later, you need to grant schema privileges:

```sql
\c myprojectdb
GRANT ALL ON SCHEMA public TO myprojectuser;
```

Exit the PostgreSQL shell:

```sql
\q
```

---

## Python Environment Setup

### Install Python and pip

Ubuntu 22.04 comes with Python 3.10+, but ensure you have pip and venv:

```bash
sudo apt install python3-pip python3-venv
```

### Create a Virtual Environment

**Why use virtual environments?**
- Isolates project dependencies
- Prevents conflicts between projects
- Makes deployment easier
- Allows different Python/package versions per project

Create a virtual environment for your project:

```bash
# Create a directory for your project
mkdir ~/myproject
cd ~/myproject

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate
```

Your terminal prompt should now show `(venv)` indicating the virtual environment is active.

### Upgrade pip and Install Wheel

```bash
pip install --upgrade pip wheel setuptools
```

---

## Django Installation and Project Creation

### Install Django and psycopg2

```bash
# Install Django (latest stable version)
pip install django

# Install PostgreSQL adapter
pip install psycopg2-binary
```

**Note:** `psycopg2-binary` is easier to install but `psycopg2` is recommended for production. For production, use:
```bash
pip install psycopg2
```

### Verify Installation

```bash
django-admin --version
```

You should see something like `5.0.1` or whatever the current Django version is.

### Create Your Django Project

```bash
django-admin startproject myproject .
```

**Note the dot (`.`) at the end** - this creates the project in the current directory instead of creating a nested directory.

Your directory structure should now look like:

```
~/myproject/
├── venv/
├── myproject/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
└── manage.py
```

---

## Database Configuration

### Configure Django Settings

Open the settings file:

```bash
nano ~/myproject/myproject/settings.py
```

Or use your preferred editor (vim, VSCode, etc.)

### Update ALLOWED_HOSTS

Find the `ALLOWED_HOSTS` line and update it:

```python
# For development
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# For production, add your domain/IP
# ALLOWED_HOSTS = ['example.com', 'www.example.com', '1.2.3.4']
```

### Configure Database Connection

Find the `DATABASES` section and replace it with:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'myprojectdb',
        'USER': 'myprojectuser',
        'PASSWORD': 'your_secure_password_here',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

**Security Best Practice:** Don't hardcode passwords in settings.py. Use environment variables:

```python
import os

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'myprojectdb'),
        'USER': os.environ.get('DB_USER', 'myprojectuser'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

Then set environment variables:

```bash
export DB_PASSWORD='your_secure_password_here'
```

Or use python-decouple or django-environ for better environment management.

### Additional Recommended Settings

While you're in settings.py, consider these additions:

```python
# Timezone
TIME_ZONE = 'America/New_York'  # Adjust to your timezone

# Static files (for production)
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Security settings (for production)
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
```

---

## Running Your Application

### Apply Database Migrations

Run Django's initial migrations to create necessary tables:

```bash
cd ~/myproject
python manage.py makemigrations
python manage.py migrate
```

You should see output showing tables being created.

### Create a Superuser

Create an admin account:

```bash
python manage.py createsuperuser
```

Follow the prompts to set:
- Username
- Email address (optional)
- Password (enter twice)

### Start the Development Server

```bash
python manage.py runserver 0.0.0.0:8000
```

**Access your application:**
- Main site: `http://localhost:8000/`
- Admin interface: `http://localhost:8000/admin/`

Log in with your superuser credentials.

### Running the Server in the Background

For development, you might want the server running while you work:

**Using screen:**
```bash
screen -S django-dev
python manage.py runserver 0.0.0.0:8000
# Press Ctrl+A then D to detach
# Reattach with: screen -r django-dev
```

**Using tmux (recommended):**
```bash
tmux new -s django-dev
python manage.py runserver 0.0.0.0:8000
# Press Ctrl+B then D to detach
# Reattach with: tmux attach -t django-dev
```

---

## What's Changed Since 2016

If you're coming from my original 2016 gist, here are the major updates:

### Python 2.7 → Python 3.10+
- Python 2 reached end-of-life in 2020
- All modern Django development uses Python 3
- Syntax changes: `print` is now a function, string handling improved

### Django 1.9 → Django 5.0
- **Async support** - Django now has native async views and ORM operations
- **Improved admin** - Better UI and customization options
- **Better security defaults** - More secure out of the box
- **Path routing** - New `path()` function replaces old regex patterns
- **Type hints** - Better IDE support and code completion

### Ubuntu 16.04 → Ubuntu 22.04+
- **Python 3 by default** - No need to specify python3
- **Systemd everywhere** - Different service management
- **Better security** - AppArmor, improved firewall defaults

### Development Practices
- **Virtual environments are mandatory** - No more global pip installs
- **Environment variables** - Don't hardcode secrets
- **Docker is common** - Consider containerization for production
- **CI/CD pipelines** - Automated testing and deployment

### Database
- `psycopg2-binary` vs `psycopg2` distinction
- Connection pooling is more important at scale
- PostgreSQL 14+ has significant performance improvements

---

## Next Steps

Now that you have a working Django application:

1. **Create your first app:**
   ```bash
   python manage.py startapp myapp
   ```

2. **Define models** in `myapp/models.py`

3. **Create views** in `myapp/views.py`

4. **Set up URLs** in `myapp/urls.py`

5. **Create templates** in `myapp/templates/`

6. **Run migrations** after model changes:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Learning Resources

- **Official Django Tutorial:** https://docs.djangoproject.com/en/stable/intro/tutorial01/
- **Django Girls Tutorial:** https://tutorial.djangogirls.org/
- **Two Scoops of Django:** Comprehensive best practices book
- **Real Python:** https://realpython.com/tutorials/django/

### Production Deployment

For production environments, consider:

- **Web servers:** Nginx or Apache
- **WSGI servers:** Gunicorn or uWSGI
- **Process managers:** Systemd or Supervisor
- **Static files:** WhiteNoise or CDN
- **Security:** Let's Encrypt for SSL
- **Monitoring:** Sentry for error tracking
- **Containers:** Docker for consistency

### Save Your Requirements

Always maintain a requirements.txt:

```bash
pip freeze > requirements.txt
```

This allows easy recreation of your environment:

```bash
pip install -r requirements.txt
```

---

## Troubleshooting

### "pip: command not found"
```bash
sudo apt install python3-pip
```

### "psycopg2 failed to build"
```bash
sudo apt install libpq-dev python3-dev
pip install psycopg2-binary
```

### "FATAL: Peer authentication failed"
Edit `/etc/postgresql/14/main/pg_hba.conf` and change peer to md5 for local connections, then restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Port 8000 already in use
```bash
# Find the process
lsof -i :8000
# Kill it
kill -9 <PID>
# Or use a different port
python manage.py runserver 8001
```

---

## Conclusion

You now have a fully functional Django development environment with PostgreSQL! This setup provides a solid foundation for building web applications, from simple prototypes to complex production systems.

The key takeaways:
- Use virtual environments for every project
- Keep credentials out of version control
- Follow Django's security best practices
- Stay updated with the latest Django LTS versions
- Test thoroughly before deploying to production

Happy coding! 🚀

---

*Have questions or suggestions? Feel free to reach out or leave a comment below.*

**Related Posts:**
- Setting Up Django with MySQL
- Django REST Framework Getting Started
- Deploying Django with Docker and PostgreSQL
