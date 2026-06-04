# AGENTS.md

## Mission

Build a lightweight document repository frontend using React + Vite and PHP.

OpenDocMan already exists and acts only as the document storage backend.

Users must never interact with the OpenDocMan UI.

---

## Technology Stack

Frontend:

* React
* Vite
* JavaScript

Backend:

* PHP 8+
* PDO

Database:

* MySQL

Storage:

* OpenDocMan

---

## Existing OpenDocMan Storage Rules

OpenDocMan is already installed.

Document metadata is stored in:

odm_data

Files are stored physically as:

<odm_data.id>.dat

Example:

odm_data.id = 42

Physical file:

42.dat

Original filename:

odm_data.realname

Do not change this behavior.

---

## Architecture

React SPA
↓
PHP APIs
↓
MySQL
↓
OpenDocMan Storage

React must never directly interact with OpenDocMan.

All document operations must go through PHP APIs.

---

## Core Features

Only implement:

1. Upload document
2. List documents
3. View document
4. Download document

Do not implement:

* Authentication
* Roles
* Permissions
* Notifications
* Analytics
* Search engine
* Versioning
* Workflow approvals
* Dashboards

unless explicitly requested.

---

## Frontend Rules

Use:

* React Functional Components
* Hooks
* Plain CSS

Avoid:

* Redux
* Zustand
* MobX
* Recoil
* Tailwind
* Material UI
* Ant Design
* Chakra UI
* Styled Components

Keep components simple.

Prefer local state.

---

## Backend Rules

Use:

* PDO
* Prepared Statements
* JSON APIs

Do not:

* Use frameworks
* Use ORM libraries
* Expose SQL errors
* Expose PHP warnings

---

## Security Rules

Validate:

* MIME type
* Extension
* File size

Allowed:

pdf
doc
docx
xls
xlsx
ppt
pptx
jpg
jpeg
png

Maximum file size:

20 MB

Prevent:

* SQL injection
* Path traversal
* Arbitrary file execution

---

## Design Philosophy

This is an internal business application.

Priorities:

1. Correctness
2. Security
3. Simplicity
4. Maintainability
5. UI appearance

Choose the simplest implementation that satisfies requirements.

Avoid unnecessary abstractions.

Avoid over-engineering.

---

## Project Structure

frontend/
backend/
opendocman/

Keep custom code separate from OpenDocMan.

Do not modify OpenDocMan source code unless absolutely necessary.
