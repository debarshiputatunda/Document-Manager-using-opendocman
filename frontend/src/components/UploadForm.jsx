import { useRef, useState } from 'react'
import { uploadDocument } from '../api'

function UploadForm({ existingFilenames = [], onUploaded }) {
  const fileInputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hasDuplicateFilename =
    file &&
    existingFilenames.some(
      (filename) => String(filename || '').toLowerCase() === file.name.toLowerCase(),
    )

  function selectFile(nextFile) {
    setMessage('')
    setError('')
    setUploadProgress(0)
    setFile(nextFile)
  }

  function clearFile() {
    setFile(null)
    setUploadProgress(0)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function resetForm() {
    setTitle('')
    clearFile()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Enter a document title.')
      return
    }

    if (!file) {
      setError('Choose a file to upload.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const payload = await uploadDocument({
        title: trimmedTitle,
        file,
        onProgress: setUploadProgress,
      })
      setMessage(payload.message || 'Document uploaded successfully.')
      setUploadProgress(100)
      resetForm()
      await onUploaded()
    } catch (requestError) {
      setError(requestError.message || 'The document could not be uploaded.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleDragOver(event) {
    event.preventDefault()

    if (!isUploading) {
      setIsDraggingFile(true)
    }
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDraggingFile(false)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDraggingFile(false)

    if (isUploading) {
      return
    }

    const droppedFile = event.dataTransfer.files?.[0]

    if (!droppedFile) {
      return
    }

    selectFile(droppedFile)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="panel">
      <h2>Upload Document</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={title}
            maxLength="255"
            onChange={(event) => setTitle(event.target.value)}
            disabled={isUploading}
          />
        </label>

        <div className="file-field">
          <span className="field-label">File</span>
          <div
            className={`drop-zone${isDraggingFile ? ' dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <div className="file-picker">
                <input
                  ref={fileInputRef}
                  id="document-file"
                  className="native-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(event) => selectFile(event.target.files?.[0] || null)}
                  disabled={isUploading}
                />
                <label className="file-picker-button" htmlFor="document-file">
                  Choose file
                </label>
              </div>
              <span className="drop-zone-hint">or drag and drop a file here</span>
            </div>
          </div>

          {file ? (
            <div className="selected-file">
              <div className="selected-file-info">
                <span className="file-icon" aria-hidden="true">
                  📄
                </span>
                <span className="file-name" title={file.name}>
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                className="remove-file-btn"
                onClick={clearFile}
                disabled={isUploading}
                aria-label="Remove selected file"
              >
                ✕
              </button>
            </div>
          ) : null}

          {hasDuplicateFilename ? (
            <p className="inline-warning">
              A document with this filename already exists. Uploading will create a new record.
            </p>
          ) : null}

          {isUploading ? (
            <div className="upload-progress" aria-live="polite">
              <div className="upload-progress-header">
                <span>Uploading</span>
                <span>{uploadProgress}%</span>
              </div>
              <div
                className="upload-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={uploadProgress}
              >
                <div
                  className="upload-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="upload-actions">
          <button type="submit" disabled={isUploading || !file}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      {message ? <p className="status success">{message}</p> : null}
      {error ? <p className="status error">{error}</p> : null}
    </section>
  )
}

export default UploadForm
