const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed.')
  }

  return payload
}

export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/api/documents.php`)
  const payload = await readJsonResponse(response)

  return payload.documents
}

export async function uploadDocument({ title, file }) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/upload.php`, {
    method: 'POST',
    body: formData,
  })

  return readJsonResponse(response)
}

export function viewUrl(id) {
  return `${API_BASE_URL}/api/view.php?id=${encodeURIComponent(id)}`
}

export function downloadUrl(id) {
  return `${API_BASE_URL}/api/download.php?id=${encodeURIComponent(id)}`
}
