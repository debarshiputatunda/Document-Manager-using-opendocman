# Backend API

Small PHP API layer for the custom document repository frontend.

## Configuration

The API reads the same database defaults as the local OpenDocMan install:

- `APP_DB_HOST`, default `localhost`
- `APP_DB_NAME`, default `opendocman`
- `APP_DB_USER`, default `odmuser`
- `APP_DB_PASS`, default `odm123`
- `ODM_STORAGE_DIR`, default `/Users/debarshi/Projects/opendocman frontend/document-storage`

For production-style installs, copy:

```sh
cp backend/config/production.example.php backend/config/production.php
```

Then edit `backend/config/production.php` with the target machine database credentials and storage directory. `production.php` is ignored by git so real secrets stay local. Environment variables still take precedence when set.

## Run Locally

From `document-management/`:

```sh
php -S localhost:8000 -t backend
```

Endpoints:

- `POST /api/upload.php`
- `GET /api/documents.php?page=1&page_size=10&search=&date=&sort=upload_date&direction=desc`
- `GET /api/view.php?id={id}`
- `GET /api/download.php?id={id}`
- `POST /api/update_title.php`
- `POST /api/delete.php`
- `GET /api/health.php`

All endpoints return JSON except successful file streams from `view.php` and `download.php`.

## Documents Query Parameters

`GET /api/documents.php` supports:

- `page`
- `page_size`
- `search`
- `date`
- `sort`
- `direction`

Allowed sort values:

- `title`
- `type`
- `filename`
- `upload_date`

## Health Check

```sh
curl http://localhost:8000/api/health.php
```

The health endpoint checks API availability, MySQL connectivity, and document storage readability/writability.
