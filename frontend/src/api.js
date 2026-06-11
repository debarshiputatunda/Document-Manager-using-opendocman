const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed.')
  }

  return payload
}

export async function fetchDocuments({
  page = 1,
  pageSize = 10,
  search = '',
  date = '',
  sort = 'upload_date',
  direction = 'desc',
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    sort,
    direction,
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (date) {
    params.set('date', date)
  }

  const response = await fetch(`${API_BASE_URL}/api/documents.php?${params}`)
  const payload = await readJsonResponse(response)

  return {
    documents: payload.documents,
    pagination: payload.pagination,
  }
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health.php`)
  const payload = await response.json().catch(() => null)

  if (!payload) {
    throw new Error('Health check failed.')
  }

  return payload
}

export async function uploadDocument({ title, file, onProgress }) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open('POST', `${API_BASE_URL}/api/upload.php`)

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    request.addEventListener('load', () => {
      let payload

      try {
        payload = JSON.parse(request.responseText)
      } catch {
        reject(new Error('Request failed.'))
        return
      }

      if (request.status < 200 || request.status >= 300 || !payload?.success) {
        reject(new Error(payload?.message || 'Request failed.'))
        return
      }

      resolve(payload)
    })

    request.addEventListener('error', () => {
      reject(new Error('The document could not be uploaded.'))
    })

    request.addEventListener('abort', () => {
      reject(new Error('The upload was cancelled.'))
    })

    request.send(formData)
  })
}

export async function updateDocumentTitle({ id, title }) {
  const response = await fetch(`${API_BASE_URL}/api/update_title.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, title }),
  })

  return readJsonResponse(response)
}

export async function deleteDocument({ id }) {
  const response = await fetch(`${API_BASE_URL}/api/delete.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })

  return readJsonResponse(response)
}

export function viewUrl(id) {
  return `${API_BASE_URL}/api/view.php?id=${encodeURIComponent(id)}`
}

export function downloadUrl(id) {
  return `${API_BASE_URL}/api/download.php?id=${encodeURIComponent(id)}`
}
