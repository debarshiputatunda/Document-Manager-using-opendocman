import { useEffect, useMemo, useState } from 'react'
import { downloadUrl, fetchDocuments, viewUrl } from './api'
import UploadForm from './components/UploadForm'
import './App.css'

function App() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return documents.filter((document) => {
      const title = String(document.title || '').toLowerCase()
      const filename = String(document.original_filename || '').toLowerCase()
      const matchesName = !query || title.includes(query) || filename.includes(query)
      const matchesDate = !dateFilter || documentDateValue(document.upload_date) === dateFilter

      return matchesName && matchesDate
    })
  }, [documents, searchTerm, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const visibleDocuments = filteredDocuments.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  )
  const firstVisible = filteredDocuments.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1
  const lastVisible = Math.min(activePage * PAGE_SIZE, filteredDocuments.length)

  async function loadDocuments() {
    setIsLoading(true)
    setListError('')

    try {
      const nextDocuments = await fetchDocuments()
      setDocuments(nextDocuments)
    } catch (requestError) {
      setListError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    async function loadInitialDocuments() {
      try {
        const nextDocuments = await fetchDocuments()

        if (isActive) {
          setDocuments(nextDocuments)
        }
      } catch (requestError) {
        if (isActive) {
          setListError(requestError.message)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadInitialDocuments()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Document Repository</h1>
          <p>Upload, view, and download stored documents.</p>
        </div>

        <button type="button" className="secondary-button" onClick={loadDocuments}>
          Refresh
        </button>
      </header>

      <UploadForm onUploaded={loadDocuments} />

      <section className="panel">
        <h2>Documents</h2>

        {listError ? <p className="status error">{listError}</p> : null}

        {isLoading ? (
          <p className="empty-state">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="empty-state">No documents have been uploaded yet.</p>
        ) : (
          <div className="document-list">
            <div className="document-filters">
              <label>
                <span>Name</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search title or filename"
                />
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => {
                    setDateFilter(event.target.value)
                    setCurrentPage(1)
                  }}
                />
              </label>
            </div>

            {filteredDocuments.length === 0 ? (
              <p className="empty-state">No documents match the current filters.</p>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <colgroup>
                      <col className="title-column" />
                      <col className="filename-column" />
                      <col className="date-column" />
                      <col className="actions-column" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Original filename</th>
                        <th>Upload date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDocuments.map((document) => (
                        <tr key={document.id}>
                          <td>
                            <span className="truncate-cell" title={document.title}>
                              {document.title}
                            </span>
                          </td>
                          <td>
                            <span className="truncate-cell" title={document.original_filename}>
                              {document.original_filename}
                            </span>
                          </td>
                          <td>{formatDate(document.upload_date)}</td>
                          <td>
                            <div className="actions">
                              <a
                                href={viewUrl(document.id)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`View ${document.title}`}
                                title="View"
                              >
                                <EyeIcon />
                              </a>
                              <a
                                href={downloadUrl(document.id)}
                                aria-label={`Download ${document.title}`}
                                title="Download"
                              >
                                <DownloadIcon />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <p>
                    Showing {firstVisible}-{lastVisible} of {filteredDocuments.length}
                  </p>
                  <div className="pagination-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={activePage === 1}
                    >
                      Previous
                    </button>
                    <span>
                      Page {activePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={activePage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

const PAGE_SIZE = 10

function formatDate(value) {
  if (!value) {
    return ''
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function documentDateValue(value) {
  if (!value) {
    return ''
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function EyeIcon() {
  return (
    <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

export default App
