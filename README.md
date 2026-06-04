# Document Repository Frontend

## Overview

This project is a lightweight document repository application built using:

- React + Vite (Frontend)
- PHP (Backend APIs)
- MySQL (Database)
- OpenDocMan (Storage Backend)

OpenDocMan is used only as a document storage engine.

The OpenDocMan user interface is not part of this application.

---

## Architecture

React Frontend
    ↓
PHP APIs
    ↓
MySQL
    ↓
OpenDocMan Storage

---

## Repository Structure

```text
frontend/
backend/
opendocman/
document-storage/

AGENTS.md
CONTEXT.md
PRD.md
database_schema.sql
README.md
```

---

## OpenDocMan Integration

### Metadata

Document metadata is stored in:

```sql
odm_data
```

Important fields:

```sql
id
realname
description
created
owner
category
```

### Physical Storage

Files are stored as:

```text
<odm_data.id>.dat
```

Example:

```text
42.dat
```

Original filename:

```text
odm_data.realname
```

Storage directory:

```text
document-storage/
```

---

## Required Features

### Upload Document

User provides:

- Title
- File

System:

1. Validates file
2. Inserts metadata into odm_data
3. Gets odm_data.id
4. Stores file as:

   <odm_data.id>.dat

5. Inserts reference into app_documents

---

### List Documents

Display:

- Title
- Original Filename
- Upload Date

Actions:

- View
- Download

---

### View Document

Open supported file types in browser.

---

### Download Document

Download using original filename.

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- PHP 8+
- PDO

### Database

- MySQL

---

## Development Rules

- Do not modify OpenDocMan source code.
- Do not use OpenDocMan UI.
- Keep all custom code separate from OpenDocMan.
- Use PDO prepared statements.
- Return JSON from APIs.
- Use React functional components.
- Use plain CSS.
- Avoid unnecessary dependencies.

---

## GitHub And Licensing Notes

Before pushing this project to GitHub:

- Keep OpenDocMan license files in the repository if `opendocman/` is included.
- OpenDocMan is GPL-licensed, so comply with its GPL license terms when redistributing this repository.
- Do not commit generated dependencies or build output:
  - `frontend/node_modules/`
  - `frontend/dist/`
- Do not commit runtime document storage:
  - `document-storage/`
- Do not commit local backup copies or database dumps:
  - `opendocman_new/`
  - `opendocman_backup/`
  - `opendocman_backup.sql`

These paths are covered by the root `.gitignore`.

---

## Security Requirements

Allowed file types:

- pdf
- doc
- docx
- xls
- xlsx
- ppt
- pptx
- jpg
- jpeg
- png

Maximum file size:

20 MB

Validate:

- MIME type
- Extension
- File size

Prevent:

- SQL Injection
- Path Traversal
- Arbitrary File Execution

---

## Local Development

For full machine setup instructions and prerequisite installation commands, see:

```text
install.txt
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

Serve PHP APIs locally.

Example:

```bash
php -S localhost:8080
```

---

## Database

Schema reference:

```text
database_schema.sql
```

Use this schema as the source of truth.

Do not depend on live database inspection.

---

## Agent Instructions

All AI coding agents must read:

1. AGENTS.md
2. CONTEXT.md
3. PRD.md
4. database_schema.sql

before implementation.

These files are authoritative.
