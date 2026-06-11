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
5. Search, sort, filter, and paginate documents.
6. Edit custom document titles.
7. Remove documents from the custom list without deleting OpenDocMan storage.
8. Check application health.

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
* Show upload progress
* Support drag-and-drop file selection
* Warn when the selected original filename already exists

Response:

Success or error message.

---

### List Documents

Display:

* Title
* File type
* Original filename
* Upload date

Actions:

* Edit title
* View
* Download

Controls:

* Search by title or original filename
* Filter by upload date
* Sort by title, file type, original filename, or upload date
* Server-side pagination, 10 documents per page by default

---

### View Document

Open supported file types in browser.

If browser preview is unavailable:

Prompt the user to download the file instead.

---

### Download Document

Download original document using original filename.

---

### Edit Document Title

Allow users to edit the custom app title stored in `app_documents.title`.

Do not modify the OpenDocMan physical file or original filename.

---

### Soft Delete

Allow users to remove a document from the custom list by setting `app_documents.deleted_at`.

Do not delete `odm_data` rows or physical `<odm_data.id>.dat` files.

---

### Health Check

Provide an API and simple frontend page that checks:

* API reachability
* Database connectivity
* Storage directory readability/writability

---

## API Requirements

POST /api/upload.php

Upload document.

---

GET /api/documents.php

List documents with server-side search, date filter, sorting, and pagination.

Supported query parameters:

* page
* page_size
* search
* date
* sort
* direction

---

GET /api/view.php?id={id}

View document.

---

GET /api/download.php?id={id}

Download document.

---

POST /api/update_title.php

Update the custom document title.

---

POST /api/delete.php

Soft delete a custom app document row.

---

GET /api/health.php

Return application health status.

---

## UI Requirements

Layout:

Header

Upload Form

Document Table

Health page at `/health`

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
9. Production config example.
10. Health check API/page.
