# CONTEXT.md

## Project Purpose

Create a simple document repository frontend.

The application allows users to:

* Upload files
* View uploaded files
* Download files

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
odm_id INT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Relationship:

app_documents.odm_id -> odm_data.id

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
Find odm_id
↓
Find Original Filename
↓
Load:

<odm_id>.dat

```
↓
```

Return File To Browser

---

## Frontend Requirements

React + Vite

Single page application.

Simple and functional.

No dashboards.

No complex navigation.

No admin panels.

Only:

* Upload form
* Document list
* View action
* Download action


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