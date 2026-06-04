import { useRef, useState } from 'react'
import { uploadDocument } from '../api'

function UploadForm({ onUploaded }) {
  const fileInputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function clearFile() {
    setFile(null)

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

    try {
      const payload = await uploadDocument({ title: trimmedTitle, file })
      setMessage(payload.message || 'Document uploaded successfully.')
      resetForm()
      await onUploaded()
    } catch (requestError) {
      setError(requestError.message || 'The document could not be uploaded.')
    } finally {
      setIsUploading(false)
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
          <div className="file-picker">
            <input
              ref={fileInputRef}
              id="document-file"
              className="native-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              disabled={isUploading}
            />
            <label className="file-picker-button" htmlFor="document-file">
              Choose file
            </label>
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
