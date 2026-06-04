# Backend API

Small PHP API layer for the custom document repository frontend.

## Configuration

The API reads the same database defaults as the local OpenDocMan install:

- `APP_DB_HOST`, default `localhost`
- `APP_DB_NAME`, default `opendocman`
- `APP_DB_USER`, default `odmuser`
- `APP_DB_PASS`, default `odm123`
- `ODM_STORAGE_DIR`, default `/Users/debarshi/Projects/opendocman frontend/document-storage`

## Run Locally

From `document-management/`:

```sh
php -S localhost:8000 -t backend
```

Endpoints:

- `POST /api/upload.php`
- `GET /api/documents.php`
- `GET /api/view.php?id={id}`
- `GET /api/download.php?id={id}`

All endpoints return JSON except successful file streams from `view.php` and `download.php`.
