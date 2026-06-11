# CONTEXT.md

## Project Purpose

Create a simple document repository frontend.

The application allows users to:

* Upload files
* View uploaded files
* Download files
* Search, sort, and paginate documents
* Edit custom document titles
* Soft delete custom app records
* Check application health

OpenDocMan is used only for storage.

The OpenDocMan interface is not part of the application.

---

## Existing Environment

Machine:

macOS development environment

OpenDocMan Location:

~/Projects/document-management/opendocman

Document Storage Directory:

~/Projects/document-storage

Database:

opendocman

---

## OpenDocMan Findings

The upload controller generates files as:

<document_id>.dat

Example:

42.dat

Physical file path:

document-storage/42.dat

Metadata table:

odm_data

Important fields:

id
realname
description
created
owner
category

Original filename is stored in:

realname

---

## Required Application Table

CREATE TABLE app_documents (
id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(255) NOT NULL,
odm_document_id INT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
deleted_at TIMESTAMP NULL DEFAULT NULL
);

Relationship:

app_documents.odm_document_id -> odm_data.id

Soft delete behavior:

app_documents.deleted_at is set when a document is removed from the custom UI.

The OpenDocMan metadata row and physical `<odm_data.id>.dat` file are not deleted by the custom app.

---

## Expected Upload Flow

User Upload
↓
Validate File
↓
Insert Metadata Into odm_data
↓
Get odm_data.id
↓
Save File As:

<odm_data.id>.dat

```
↓
```

Insert Into app_documents
↓
Return Success

---

## Expected Download Flow

app_document_id
↓
Find app_documents.odm_document_id
↓
Find Original Filename
↓
Load:

<odm_document_id>.dat

```
↓
```

Return File To Browser

---

## Frontend Requirements

React + Vite

Single page application with a simple health route.

Simple and functional.

No dashboards.

No complex navigation.

No admin panels.

Only:

* Upload form
* Document list
* View action
* Download action
* Search/filter/sort/pagination controls
* Document details/edit panel
* Health page

Current implemented frontend behavior:

* Drag-and-drop upload
* Upload progress
* Duplicate filename warning
* Selected-file chip with remove button
* Server-side search, date filtering, sorting, and pagination
* Unsupported browser preview types prompt the user to download instead

Current implemented backend APIs:

* POST /api/upload.php
* GET /api/documents.php
* GET /api/view.php?id={id}
* GET /api/download.php?id={id}
* POST /api/update_title.php
* POST /api/delete.php
* GET /api/health.php


## OpenDocMan Storage

Physical files are stored as:

<odm_data.id>.dat

Example:

42.dat

Metadata table:

odm_data

Original filename:

odm_data.realname

Storage directory:

~/Projects/document-storage

Project root:

document-management/

All custom application code must be created inside:

frontend/
backend/

OpenDocMan remains in:

opendocman/

OpenDocMan should be treated as an existing dependency/storage backend and not as the location for new application code.

Document storage directory:

document-storage/

All uploaded files are stored there using OpenDocMan's existing convention:
<odm_data.id>.dat

## Configuration

Local defaults can be provided with environment variables:

* APP_DB_HOST
* APP_DB_NAME
* APP_DB_USER
* APP_DB_PASS
* ODM_STORAGE_DIR

Production-style installs can copy:

backend/config/production.example.php

to:

backend/config/production.php

`production.php` is ignored by git and should contain machine-specific credentials and paths.

Environment variables still take precedence when set.
