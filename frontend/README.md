# Document Repository Frontend

React + Vite single-page frontend for the simplified document repository UI.

## Run Locally

Start the PHP API first from `document-management/`:

```sh
php -S localhost:8000 -t backend
```

Then start Vite from `document-management/frontend/`:

```sh
npm run dev
```

Vite proxies `/api` requests to `http://localhost:8000`.
