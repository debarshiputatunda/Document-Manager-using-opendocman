# Document Repository Application Documentation

## Overview

This application is a lightweight document repository frontend built on top of an existing OpenDocMan installation.

OpenDocMan remains the storage backend. Users interact only with the custom React interface and PHP APIs.

Architecture:

```text
React + Vite frontend
        |
        v
PHP API layer
        |
        v
MySQL database
        |
        v
OpenDocMan metadata + document-storage files
```

Custom code lives in:

- `frontend/`
- `backend/`

OpenDocMan source lives in:

- `opendocman/`

OpenDocMan source should not be modified for this custom UI.

## Current Features

### Upload Documents

Users can upload supported document/image files from the custom UI.

Upload form fields:

- Title
- File picker

Current upload behavior:

- Validates title before upload.
- Validates that a file is selected.
- Shows user-friendly validation errors.
- Upload button is disabled until a file is selected.
- Shows selected file as a compact attachment chip.
- Allows removing the selected file before upload.
- Clears title and file fields after successful upload.
- Refreshes the document list automatically after upload.
- Does not reload the page.

### List Documents

The Documents card displays uploaded documents in a table.

Columns:

- Title
- Original filename
- Upload date
- Actions

Table behavior:

- Uses fixed layout.
- Fits within the page without horizontal scrolling.
- Long title and filename values truncate with ellipsis.
- Full title and filename are available through hover tooltips.
- Upload date is formatted without seconds.

### View And Download

Each row provides icon-only action buttons:

- View: opens supported files in the browser where possible.
- Download: downloads the original file using the original filename.

### Search, Filter, And Pagination

The Documents section includes client-side controls:

- Search by title or original filename.
- Filter by upload date.
- Paginate documents 10 at a time.
- Previous and Next navigation.
- Showing count, such as `Showing 1-10 of 25`.

These controls do not change backend behavior. They operate on the document list returned by the existing API.

## Frontend Structure

Main files:

- `frontend/src/App.jsx`
- `frontend/src/components/UploadForm.jsx`
- `frontend/src/api.js`
- `frontend/src/App.css`
- `frontend/src/index.css`

Responsibilities:

- `App.jsx`: page layout, document fetching, table display, search/filter/pagination.
- `UploadForm.jsx`: upload form state, file picker UI, validation, upload submission.
- `api.js`: frontend API helpers.
- `App.css`: application styling.
- `index.css`: global base styles.

Frontend rules:

- React functional components only.
- Hooks only.
- Plain CSS only.
- No UI framework.
- No global state library.

## Backend Structure

Main files:

- `backend/api/upload.php`
- `backend/api/documents.php`
- `backend/api/view.php`
- `backend/api/download.php`
- `backend/api/helpers.php`
- `backend/config/database.php`
- `backend/config/app.php`

Backend rules:

- PHP APIs.
- PDO database access.
- Prepared statements.
- JSON responses for API operations.
- File stream responses for successful view/download operations.
- No PHP framework.
- No ORM.

## APIs Added

### `POST /api/upload.php`

Uploads a document.

Input:

- `title`
- `file`

Behavior:

- Validates title.
- Validates file size, extension, and MIME type.
- Inserts metadata into `odm_data`.
- Stores file as `<odm_data.id>.dat` in `document-storage`.
- Inserts custom record into `app_documents`.
- Returns JSON.

Successful response:

```json
{
  "success": true,
  "message": "Document uploaded successfully.",
  "document": {
    "id": 1,
    "title": "Example",
    "original_filename": "example.pdf"
  }
}
```

### `GET /api/documents.php`

Lists documents.

Behavior:

- Reads from `app_documents`.
- Joins to `odm_data`.
- Returns document title, original filename, upload date, and action URLs.

Successful response:

```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "title": "Example",
      "original_filename": "example.pdf",
      "upload_date": "2026-06-04 23:23:00",
      "view_url": "/api/view.php?id=1",
      "download_url": "/api/download.php?id=1"
    }
  ]
}
```

### `GET /api/view.php?id={id}`

Views a document.

Behavior:

- Resolves custom app document ID.
- Finds linked OpenDocMan document ID.
- Loads `document-storage/<odm_data.id>.dat`.
- Streams supported browser-viewable files inline.
- Falls back to attachment behavior for files that browsers usually cannot preview.

### `GET /api/download.php?id={id}`

Downloads a document.

Behavior:

- Resolves custom app document ID.
- Finds linked OpenDocMan document ID.
- Loads `document-storage/<odm_data.id>.dat`.
- Streams file as an attachment using `odm_data.realname`.

## Database Tables

### `app_documents`

Custom application table.

Important columns:

- `id`
- `title`
- `odm_document_id`
- `created_at`

Relationship:

```text
app_documents.odm_document_id -> odm_data.id
```

### `odm_data`

OpenDocMan metadata table.

Important columns:

- `id`
- `realname`
- `description`
- `created`
- `owner`
- `category`
- `department`
- `publishable`

Original filename is stored in:

```text
odm_data.realname
```

Physical files are stored as:

```text
document-storage/<odm_data.id>.dat
```

Example:

```text
odm_data.id = 42
document-storage/42.dat
```

## Application Flowchart

```mermaid
flowchart TD
    A["User opens React app"] --> B["React loads Documents page"]
    B --> C["GET /api/documents.php"]
    C --> D["PHP connects to MySQL with PDO"]
    D --> E["Query app_documents joined with odm_data"]
    E --> F["Return JSON document list"]
    F --> G["React renders table"]

    G --> H["User searches by title or filename"]
    H --> I["React filters current list client-side"]
    I --> J["React paginates 10 documents per page"]

    G --> K["User filters by upload date"]
    K --> I

    G --> L["User clicks View"]
    L --> M["GET /api/view.php?id={app_document_id}"]
    M --> N["Resolve app_documents.odm_document_id"]
    N --> O["Read document-storage/<odm_id>.dat"]
    O --> P["Stream inline when browser can preview"]

    G --> Q["User clicks Download"]
    Q --> R["GET /api/download.php?id={app_document_id}"]
    R --> S["Resolve app_documents.odm_document_id"]
    S --> T["Read document-storage/<odm_id>.dat"]
    T --> U["Stream attachment using odm_data.realname"]

    B --> V["User selects title and file"]
    V --> W["React validates title and file selection"]
    W --> X["POST /api/upload.php"]
    X --> Y["PHP validates file extension, MIME type, and size"]
    Y --> Z["Insert metadata into odm_data"]
    Z --> AA["Store file as document-storage/<odm_data.id>.dat"]
    AA --> AB["Insert row into app_documents"]
    AB --> AC["Return JSON success"]
    AC --> AD["React clears form and refreshes document list"]
    AD --> C
```

## Data Flow

### Document List Flow

```text
React App
  -> GET /api/documents.php
  -> PHP PDO query
  -> app_documents + odm_data
  -> JSON response
  -> React table
  -> Client-side search/filter/pagination
```

### Upload Flow

```text
User selects title and file
  -> React validates required fields
  -> POST multipart form data to upload.php
  -> PHP validates file
  -> Insert into odm_data
  -> Move uploaded file to document-storage/<odm_data.id>.dat
  -> Insert into app_documents
  -> Return JSON success
  -> React resets form
  -> React refreshes document list
```

### View Flow

```text
User clicks View
  -> GET /api/view.php?id={app_documents.id}
  -> PHP resolves app_documents.odm_document_id
  -> PHP loads document-storage/<odm_document_id>.dat
  -> PHP streams file with inline or attachment disposition
```

### Download Flow

```text
User clicks Download
  -> GET /api/download.php?id={app_documents.id}
  -> PHP resolves app_documents.odm_document_id
  -> PHP loads document-storage/<odm_document_id>.dat
  -> PHP streams file as attachment
  -> Browser downloads using odm_data.realname
```

## Security Notes

Current implemented safeguards:

- PDO prepared statements.
- No raw file paths accepted from the frontend.
- Document IDs are validated as integers.
- File extension allowlist.
- MIME type allowlist.
- Maximum upload size.
- Stored files use OpenDocMan naming convention.
- API errors avoid exposing SQL details to users.

Current intentionally omitted features:

- Authentication.
- Authorization UI.
- Role management.
- OpenDocMan workflow approvals.
- Dashboards.
- Analytics.
- Notifications.
- Versioning.

## Practical Improvements To Consider

### 1. Server-Side Search And Pagination

Current search/filter/pagination is client-side. This is simple and works well for moderate document counts.

For larger datasets, move search and pagination into `documents.php` using query parameters:

```text
GET /api/documents.php?search=invoice&date=2026-06-04&page=2&page_size=10
```

Benefits:

- Faster load time with many documents.
- Lower memory usage in the browser.
- Better scalability.

### 2. Sort Controls

Add sorting by:

- Title.
- Original filename.
- Upload date.

Default sort can remain newest first.

### 3. File Type Display

Show a small file type label or icon based on extension:

- PDF
- DOCX
- XLSX
- PNG

This helps users scan tables quickly.

### 4. Upload Progress

Add upload progress for larger files.

This can be implemented with `XMLHttpRequest` upload progress events or a fetch-compatible progress strategy.

### 5. Duplicate Filename Warning

Warn when a file with the same original filename already exists.

This should be informational only unless stricter rules are needed.

### 6. Document Detail Panel

Add a simple detail view showing:

- Title.
- Original filename.
- Upload date.
- File type.
- OpenDocMan ID.

Keep this as a simple modal or inline expandable row.

### 7. Soft Delete For Custom App Records

If deletion is required later, avoid deleting OpenDocMan files immediately.

Suggested approach:

- Add `deleted_at` to `app_documents`.
- Hide deleted records from the custom UI.
- Leave OpenDocMan storage intact unless an explicit archival/delete process is designed.

### 8. Better Operational Logging

Add a small custom audit table for actions taken through the custom UI:

- Upload.
- View.
- Download.

This should be separate from OpenDocMan unless there is a clear reason to integrate.

### 9. Configuration Health Check

Add a simple API such as:

```text
GET /api/health.php
```

It can verify:

- Database connection.
- Storage directory exists.
- Storage directory is readable/writable.

### 10. Production Deployment Hardening

Before production use:

- Restrict CORS to the deployed frontend origin.
- Serve PHP APIs behind HTTPS.
- Ensure `document-storage` is outside the public web root.
- Configure PHP upload limits to match the app limit.
- Add server-level file execution protections for storage directories.

## New Machine Setup Scripts

Before running setup, read:

```text
install.txt
```

It lists required software, install commands, setup commands, and common error fixes.

### macOS/Linux

```sh
./setup-new-machine.sh
```

This script creates a fresh database from `database_schema.sql`. It does not import `opendocman_backup.sql` and does not carry document data from this machine.

### Windows

Use PowerShell from `document-management/`:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-windows.ps1
```

To explicitly request Administrator relaunch if needed:

```powershell
.\setup-windows.ps1 -RequireAdmin
```

The Windows script also creates a fresh database from `database_schema.sql`. It does not import `opendocman_backup.sql` and does not carry document data from this machine.

The setup scripts:

- Checks PHP, Node.js, npm, and MySQL.
- Creates/verifies the document storage directory.
- Verifies the MySQL connection.
- Creates or prepares the database.
- Optionally updates OpenDocMan `odm_settings.dataDir`.
- Installs frontend dependencies.
- Builds the frontend.
- Prints the backend and frontend run commands.

Run help for all options:

```sh
./setup-new-machine.sh --help
```

## Local Development

Start the backend from `document-management/`:

```sh
php -S localhost:8000 -t backend
```

Start the frontend from `document-management/frontend/`:

```sh
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

Backend URL:

```text
http://localhost:8000/
```

Vite proxies `/api` requests to the PHP backend during local development.
