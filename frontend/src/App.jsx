import { useEffect, useState } from 'react'
import {
  deleteDocument,
  downloadUrl,
  fetchDocuments,
  fetchHealth,
  updateDocumentTitle,
  viewUrl,
} from './api'
import UploadForm from './components/UploadForm'
import './App.css'

function App() {
  return window.location.pathname === '/health' ? <HealthPage /> : <RepositoryPage />
}

function RepositoryPage() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('upload_date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [detailsMessage, setDetailsMessage] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [isDeletingDocument, setIsDeletingDocument] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: PAGE_SIZE,
    total: 0,
    total_pages: 1,
  })

  const activePage = pagination.page
  const totalPages = pagination.total_pages
  const firstVisible = pagination.total === 0 ? 0 : (activePage - 1) * pagination.page_size + 1
  const lastVisible = Math.min(activePage * pagination.page_size, pagination.total)
  const hasFilters = Boolean(searchTerm.trim() || dateFilter)
  const showInitialLoading = isLoading && documents.length === 0 && !hasFilters
  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) || null
  const existingFilenames = documents.map((document) => document.original_filename)

  function updateSort(nextField) {
    setCurrentPage(1)
    setSortDirection((currentDirection) =>
      sortField === nextField && currentDirection === 'asc' ? 'desc' : 'asc',
    )
    setSortField(nextField)
  }

  function clearFilters() {
    setSearchTerm('')
    setDateFilter('')
    setCurrentPage(1)
  }

  function selectDocument(document) {
    setSelectedDocumentId(document.id)
    setEditTitle(document.title)
    setDetailsMessage('')
    setDetailsError('')
  }

  function closeDetailsPanel() {
    setSelectedDocumentId(null)
    setDetailsMessage('')
    setDetailsError('')
  }

  function handleViewDocument(document) {
    if (!canPreviewInBrowser(document.original_filename)) {
      const shouldDownload = window.confirm(
        `"${document.original_filename}" may not preview correctly in the browser. Download it instead?`,
      )

      if (shouldDownload) {
        window.location.href = downloadUrl(document.id)
      }

      return
    }

    window.open(viewUrl(document.id), '_blank', 'noopener,noreferrer')
  }

  async function handleTitleUpdate(event) {
    event.preventDefault()
    setDetailsMessage('')
    setDetailsError('')

    const trimmedTitle = editTitle.trim()

    if (!selectedDocument) {
      setDetailsError('Choose a document first.')
      return
    }

    if (!trimmedTitle) {
      setDetailsError('Title is required.')
      return
    }

    setIsSavingTitle(true)

    try {
      const payload = await updateDocumentTitle({
        id: selectedDocument.id,
        title: trimmedTitle,
      })
      setDetailsMessage(payload.message)
      await loadDocuments()
      setEditTitle(trimmedTitle)
    } catch (requestError) {
      setDetailsError(requestError.message)
    } finally {
      setIsSavingTitle(false)
    }
  }

  async function handleSoftDelete() {
    setDetailsMessage('')
    setDetailsError('')

    if (!selectedDocument) {
      setDetailsError('Choose a document first.')
      return
    }

    const confirmed = window.confirm(
      `Remove "${selectedDocument.title}" from this list? The stored file will not be deleted.`,
    )

    if (!confirmed) {
      return
    }

    setIsDeletingDocument(true)

    try {
      const payload = await deleteDocument({ id: selectedDocument.id })
      setDetailsMessage(payload.message)
      setSelectedDocumentId(null)
      setEditTitle('')
      await loadDocuments()
    } catch (requestError) {
      setDetailsError(requestError.message)
    } finally {
      setIsDeletingDocument(false)
    }
  }

  async function loadDocuments(overrides = {}) {
    const page = overrides.page ?? currentPage
    const pageSize = overrides.pageSize ?? PAGE_SIZE
    const search = overrides.search ?? searchTerm
    const date = overrides.date ?? dateFilter
    const sort = overrides.sort ?? sortField
    const direction = overrides.direction ?? sortDirection

    setIsLoading(true)
    setListError('')

    try {
      const payload = await fetchDocuments({
        page,
        pageSize,
        search,
        date,
        sort,
        direction,
      })
      setDocuments(payload.documents)
      setPagination(payload.pagination)

      if (payload.pagination.page !== currentPage) {
        setCurrentPage(payload.pagination.page)
      }
    } catch (requestError) {
      setListError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    async function loadInitialDocuments() {
      setIsLoading(true)
      setListError('')

      try {
        const payload = await fetchDocuments({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm,
          date: dateFilter,
          sort: sortField,
          direction: sortDirection,
        })

        if (isActive) {
          setDocuments(payload.documents)
          setPagination(payload.pagination)

          if (payload.pagination.page !== currentPage) {
            setCurrentPage(payload.pagination.page)
          }
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
  }, [currentPage, dateFilter, searchTerm, sortDirection, sortField])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Document Repository</h1>
          <p>Upload, view, and download stored documents.</p>
        </div>

        <div className="app-header-actions">
          <a className="secondary-link" href="/health">
            Health
          </a>
          <button type="button" className="secondary-button" onClick={loadDocuments}>
            Refresh
          </button>
        </div>
      </header>

      <UploadForm
        existingFilenames={existingFilenames}
        onUploaded={() => {
          setCurrentPage(1)
          loadDocuments({ page: 1 })
        }}
      />

      <section className="panel">
        <h2>Documents</h2>

        {listError ? <p className="status error">{listError}</p> : null}

        {showInitialLoading ? (
          <p className="empty-state">Loading documents...</p>
        ) : documents.length === 0 && !hasFilters ? (
          <div className="empty-state-block">
            <p>No documents have been uploaded yet.</p>
            <p>Upload your first document to get started.</p>
          </div>
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

            <p className={`loading-note${isLoading ? '' : ' hidden'}`}>
              Updating documents...
            </p>

            <>
                <div className="table-wrap">
                  <table>
                    <colgroup>
                      <col className="title-column" />
                      <col className="type-column" />
                      <col className="filename-column" />
                      <col className="date-column" />
                      <col className="actions-column" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>
                          <SortButton
                            field="title"
                            label="Title"
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={updateSort}
                          />
                        </th>
                        <th>
                          <SortButton
                            field="type"
                            label="Type"
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={updateSort}
                          />
                        </th>
                        <th>
                          <SortButton
                            field="filename"
                            label="Original filename"
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={updateSort}
                          />
                        </th>
                        <th>
                          <SortButton
                            field="upload_date"
                            label="Upload date"
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={updateSort}
                          />
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan="5">
                            <div className="table-empty-state">
                              <p>No documents match the current filters.</p>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={clearFilters}
                              >
                                Clear filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        documents.map((document) => (
                        <tr key={document.id}>
                          <td>
                            <span className="truncate-cell" title={document.title}>
                              {document.title}
                            </span>
                          </td>
                          <td>
                            <span className="file-type-badge">
                              {getFileType(document.original_filename)}
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
                              <button
                                type="button"
                                className="table-icon-button"
                                onClick={() => selectDocument(document)}
                                aria-label={`Edit ${document.title}`}
                                title="Edit"
                              >
                                <EditIcon />
                              </button>
                              <button
                                type="button"
                                className="table-icon-button"
                                onClick={() => handleViewDocument(document)}
                                aria-label={`View ${document.title}`}
                                title="View"
                              >
                                <EyeIcon />
                              </button>
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {documents.length > 0 && selectedDocument ? (
                  <div className="details-panel">
                    <button
                      type="button"
                      className="details-close-button"
                      onClick={closeDetailsPanel}
                      aria-label="Close edit panel"
                      title="Close"
                    >
                      ✕
                    </button>
                    <div className="details-header">
                      <div>
                        <h3>Document Details</h3>
                        <p>{selectedDocument.original_filename}</p>
                      </div>
                    </div>

                    <dl className="details-grid">
                      <div>
                        <dt>Type</dt>
                        <dd>{getFileType(selectedDocument.original_filename)}</dd>
                      </div>
                      <div>
                        <dt>Upload date</dt>
                        <dd>{formatDate(selectedDocument.upload_date)}</dd>
                      </div>
                      <div>
                        <dt>App ID</dt>
                        <dd>{selectedDocument.id}</dd>
                      </div>
                      <div>
                        <dt>OpenDocMan ID</dt>
                        <dd>{selectedDocument.odm_document_id}</dd>
                      </div>
                    </dl>

                    <form className="edit-title-form" onSubmit={handleTitleUpdate}>
                      <label>
                        <span>Title</span>
                        <input
                          type="text"
                          value={editTitle}
                          maxLength="255"
                          onChange={(event) => setEditTitle(event.target.value)}
                          disabled={isSavingTitle || isDeletingDocument}
                        />
                      </label>
                      <div className="details-actions">
                        <button type="submit" disabled={isSavingTitle || isDeletingDocument}>
                          {isSavingTitle ? 'Saving...' : 'Save title'}
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={handleSoftDelete}
                          disabled={isSavingTitle || isDeletingDocument}
                        >
                          {isDeletingDocument ? 'Removing...' : 'Remove from list'}
                        </button>
                      </div>
                    </form>

                    {detailsMessage ? (
                      <p className="status success">{detailsMessage}</p>
                    ) : null}
                    {detailsError ? <p className="status error">{detailsError}</p> : null}
                  </div>
                ) : null}

                {documents.length > 0 ? (
                  <div className="pagination">
                  <p>
                    Showing {firstVisible}-{lastVisible} of {pagination.total}
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
                ) : null}
              </>
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

function getFileType(filename) {
  const extension = String(filename || '').split('.').pop()

  if (!extension || extension === filename) {
    return 'FILE'
  }

  return extension.slice(0, 6).toUpperCase()
}

function canPreviewInBrowser(filename) {
  const extension = String(filename || '').split('.').pop().toLowerCase()

  return ['pdf', 'jpg', 'jpeg', 'png'].includes(extension)
}

function SortButton({ field, label, sortField, sortDirection, onSort }) {
  const isActive = sortField === field
  const nextDirection = isActive && sortDirection === 'asc' ? 'descending' : 'ascending'
  const indicator = isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'

  return (
    <button
      type="button"
      className={`sort-button${isActive ? ' active' : ''}`}
      onClick={() => onSort(field)}
      aria-label={`Sort ${label} ${nextDirection}`}
      title={`Sort ${label} ${nextDirection}`}
    >
      <span>{label}</span>
      <span className="sort-indicator" aria-hidden="true">
        {indicator}
      </span>
    </button>
  )
}

function EyeIcon() {
  return (
    <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

function HealthPage() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadHealth() {
    setIsLoading(true)
    setError('')

    try {
      const payload = await fetchHealth()
      setHealth(payload)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    async function loadInitialHealth() {
      try {
        const payload = await fetchHealth()

        if (isActive) {
          setHealth(payload)
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadInitialHealth()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>System Health</h1>
          <p>API, database, and storage status for this installation.</p>
        </div>

        <div className="app-header-actions">
          <a className="secondary-link" href="/">
            Repository
          </a>
          <button type="button" className="secondary-button" onClick={loadHealth}>
            Refresh
          </button>
        </div>
      </header>

      <section className="panel">
        <h2>Health Check</h2>

        {isLoading ? <p className="empty-state">Checking system health...</p> : null}
        {error ? <p className="status error">{error}</p> : null}

        {health ? (
          <div className="health-summary">
            <p className={`health-status ${health.status === 'ok' ? 'ok' : 'degraded'}`}>
              {health.status === 'ok' ? 'Healthy' : 'Needs attention'}
            </p>
            <p className="health-timestamp">Last checked {formatDate(health.timestamp)}</p>

            <div className="health-checks">
              {Object.entries(health.checks).map(([name, check]) => (
                <div className="health-check" key={name}>
                  <span className={`health-dot ${check.ok ? 'ok' : 'degraded'}`} />
                  <div>
                    <strong>{formatHealthName(name)}</strong>
                    <p>{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function formatHealthName(value) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default App
