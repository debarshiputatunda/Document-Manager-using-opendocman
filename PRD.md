# PRD.md

# Document Repository Frontend

## Objective

Build a lightweight document management frontend that uses an existing OpenDocMan installation as a storage backend.

Users must be able to upload, view, and download documents through a custom React interface.

This project is intentionally small. Do not add architecture, dependencies, abstractions, patterns, frameworks, state management solutions, design systems, caching layers, authentication systems, or microservice concepts unless explicitly requested. Prefer the simplest implementation that satisfies the requirements.

---

## Success Criteria

Users can:

1. Upload a document.
2. See uploaded documents.
3. Open documents.
4. Download documents.

No OpenDocMan UI should be visible.

---

## Technology

Frontend:
React + Vite

Backend:
PHP

Database:
MySQL

Storage:
OpenDocMan

---

## Functional Requirements

### Upload Document

Inputs:

* Title
* File

Actions:

* Validate file
* Insert metadata into odm_data
* Save file as <odm_data.id>.dat
* Insert row into app_documents

Response:

Success or error message.

---

### List Documents

Display:

* Title
* Original filename
* Upload date

Actions:

* View
* Download

---

### View Document

Open supported file types in browser.

If browser preview is unavailable:

Download file.

---

### Download Document

Download original document using original filename.

---

## API Requirements

POST /api/upload.php

Upload document.

---

GET /api/documents.php

List documents.

---

GET /api/view.php?id={id}

View document.

---

GET /api/download.php?id={id}

Download document.

---

## UI Requirements

Layout:

Header

Upload Form

Document Table

Design:

* White background
* Minimal styling
* Responsive layout
* Business application appearance

Avoid:

* Animations
* Complex effects
* Fancy dashboards
* Modern design trends

---

## Non-Functional Requirements

Fast loading.

Simple codebase.

Easy maintenance.

Minimal dependencies.

No framework coupling.

---

## Deliverables

1. React frontend.
2. PHP API layer.
3. Database script.
4. Upload implementation.
5. View implementation.
6. Download implementation.
7. Setup documentation.
8. README.
