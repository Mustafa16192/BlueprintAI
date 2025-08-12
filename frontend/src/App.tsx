import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'

type ReviewResponse = { review: string }
type GenerateResponse = { text: string }

type TabKey =
  | 'slides'
  | 'exec'
  | 'swot'
  | 'market'
  | 'frameworks'
  | 'meeting'

// GeneratorForm component moved outside to prevent recreation
const GeneratorForm = ({ 
  purposePlaceholder, 
  context, 
  setContext, 
  audience, 
  setAudience, 
  tone, 
  setTone, 
  format, 
  setFormat, 
  onGenerate, 
  isLoading 
}: {
  purposePlaceholder: string
  context: string
  setContext: (value: string) => void
  audience: string
  setAudience: (value: string) => void
  tone: string
  setTone: (value: string) => void
  format: string
  setFormat: (value: string) => void
  onGenerate: () => void
  isLoading: boolean
}) => (
  <div className="generator">
    <div className="grid">
      <div className="grid-col">
        <label className="label">Context / Notes</label>
        <textarea
          className="textarea"
          placeholder={purposePlaceholder}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={8}
        />
      </div>
      <div className="grid-col">
        <label className="label">Audience</label>
        <input 
          className="input" 
          value={audience} 
          onChange={(e) => setAudience(e.target.value)} 
        />
        <label className="label">Tone</label>
        <input 
          className="input" 
          value={tone} 
          onChange={(e) => setTone(e.target.value)} 
        />
        <label className="label">Format</label>
        <input 
          className="input" 
          value={format} 
          onChange={(e) => setFormat(e.target.value)} 
        />
        <div className="gen-actions">
          <button 
            className="upload-btn primary" 
            onClick={onGenerate} 
            disabled={isLoading || !context.trim()}
          >
            {isLoading ? (<><span className="spinner"></span>Generating...</>) : 'Generate'}
          </button>
          <button 
            className="upload-btn secondary" 
            onClick={() => { setContext(''); }} 
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
)

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('slides')
  const [review, setReview] = useState<string>('')
  const [genText, setGenText] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState<boolean>(false)

  // shared inputs for generator tabs
  const [context, setContext] = useState<string>('')
  const [audience, setAudience] = useState<string>('Executives')
  const [tone, setTone] = useState<string>('Concise, actionable')
  const [format, setFormat] = useState<string>('Bulleted sections with headings')

  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setFileName(file.name)
      if (inputRef.current) {
        inputRef.current.files = e.dataTransfer.files
      }
    }
  }

  const handleUpload = async () => {
    setError('')
    setReview('')
    setGenText('')
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError('Please choose a PDF to upload.')
      return
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setIsLoading(true)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Upload failed with status ${res.status}`)
      }
      const data = (await res.json()) as ReviewResponse
      setReview(data.review)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const callGenerate = async (purpose: string) => {
    setError('')
    setReview('')
    setGenText('')
    if (!context.trim()) {
      setError('Please provide some context or notes to work with.')
      return
    }
    try {
      setIsLoading(true)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, context, audience, tone, format, max_tokens: 900 }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Generation failed with status ${res.status}`)
      }
      const data = (await res.json()) as GenerateResponse
      setGenText(data.text)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setReview('')
    setGenText('')
    setError('')
    setFileName('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const openFileDialog = () => inputRef.current?.click()

  const ToolTabs = () => (
    <nav className="tabs" role="tablist" aria-label="Consulting tools">
      <button className={`tab ${activeTab === 'slides' ? 'active' : ''}`} onClick={() => setActiveTab('slides')}>Slide Reviewer</button>
      <button className={`tab ${activeTab === 'exec' ? 'active' : ''}`} onClick={() => setActiveTab('exec')}>Executive Summary</button>
      <button className={`tab ${activeTab === 'swot' ? 'active' : ''}`} onClick={() => setActiveTab('swot')}>SWOT Analysis</button>
      <button className={`tab ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>Market Sizing</button>
      <button className={`tab ${activeTab === 'frameworks' ? 'active' : ''}`} onClick={() => setActiveTab('frameworks')}>Frameworks</button>
      <button className={`tab ${activeTab === 'meeting' ? 'active' : ''}`} onClick={() => setActiveTab('meeting')}>Meeting Notes → Actions</button>
    </nav>
  )

  const GenOutput = () => (
    genText ? (
      <section className="review-section">
        <div className="review-header">
          <h2>Generated Output</h2>
          <div className="review-badge">AI Generated</div>
        </div>
        <div className="review-content">
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{genText}</ReactMarkdown>
          </div>
        </div>
      </section>
    ) : null
  )

  return (
    <div className={`app-container theme-umich`}>
      <div className="content-wrapper">
        <header className="app-header">
          <div className="logo">
            <h1>Blueprint by <span style={{ color: '#FFCB05' }}>MGCC</span></h1>
          </div>
          <p className="app-description">All-in-one toolkit for management consultants</p>
          <ToolTabs />
        </header>

        <main className="main-content">
          {activeTab === 'slides' && (
            <div className="upload-section">
              <div className="upload-area">
                <input ref={inputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="file-input" />
                <div className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${fileName ? 'has-file' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={openFileDialog}>
                  <div className="upload-icon">{fileName ? '📄' : '📁'}</div>
                  <div className="upload-text">
                    {fileName ? (<><strong>{fileName}</strong><span>Click to change file</span></>) : (<><strong>Drop your pitch deck here</strong><span>or click to browse</span></>)}
                  </div>
                  <div className="file-type-hint">PDF files only</div>
                </div>
                <div className="upload-actions">
                  <button className="upload-btn primary" onClick={handleUpload} disabled={isLoading || !fileName}>
                    {isLoading ? (<><span className="spinner"></span>Analyzing...</>) : 'Analyze Slides'}
                  </button>
                  {fileName && (<button className="upload-btn secondary" onClick={reset} disabled={isLoading}>Clear</button>)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exec' && (
            <GeneratorForm 
              purposePlaceholder="Executive Summary"
              context={context}
              setContext={setContext}
              audience={audience}
              setAudience={setAudience}
              tone={tone}
              setTone={setTone}
              format={format}
              setFormat={setFormat}
              onGenerate={() => callGenerate("Executive Summary")}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'swot' && (
            <GeneratorForm 
              purposePlaceholder="SWOT Analysis"
              context={context}
              setContext={setContext}
              audience={audience}
              setAudience={setAudience}
              tone={tone}
              setTone={setTone}
              format={format}
              setFormat={setFormat}
              onGenerate={() => callGenerate("SWOT Analysis")}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'market' && (
            <GeneratorForm 
              purposePlaceholder="Market Sizing (assumptions, top-down/bottom-up)"
              context={context}
              setContext={setContext}
              audience={audience}
              setAudience={setAudience}
              tone={tone}
              setTone={setTone}
              format={format}
              setFormat={setFormat}
              onGenerate={() => callGenerate("Market Sizing (assumptions, top-down/bottom-up)")}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'frameworks' && (
            <GeneratorForm 
              purposePlaceholder="Apply framework (Porter Five Forces / 3C / 4P / Value Chain / MECE)"
              context={context}
              setContext={setContext}
              audience={audience}
              setAudience={setAudience}
              tone={tone}
              setTone={setTone}
              format={format}
              setFormat={setFormat}
              onGenerate={() => callGenerate("Apply framework (Porter Five Forces / 3C / 4P / Value Chain / MECE)")}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'meeting' && (
            <GeneratorForm 
              purposePlaceholder="Meeting notes → Action items, decisions, risks, owners"
              context={context}
              setContext={setContext}
              audience={audience}
              setAudience={setAudience}
              tone={tone}
              setTone={setTone}
              format={format}
              setFormat={setFormat}
              onGenerate={() => callGenerate("Meeting notes → Action items, decisions, risks, owners")}
              isLoading={isLoading}
            />
          )}

          {error && (
            <div className="error-message" role="alert">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <strong>Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {isLoading && activeTab !== 'slides' && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <div className="loading-text">
                <strong>Generating...</strong>
                <span>Crafting a structured, consultant-grade output</span>
              </div>
            </div>
          )}

          {review && activeTab === 'slides' && (
            <section className="review-section">
              <div className="review-header">
                <h2>Analysis Results</h2>
                <div className="review-badge">AI Generated</div>
              </div>
              <div className="review-content">
                <div className="markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
                </div>
              </div>
            </section>
          )}

          {activeTab !== 'slides' && <GenOutput />}
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <span>Powered by <img src="/MGCC_LOGO_2024_no_des.png" alt="MGCC Logo" className="logo-icon" style={{ height: '1em', verticalAlign: 'middle', paddingLeft: '0.3em' }} /></span>
            <span>•</span>
            <span>Michigan Graduate Consulting Club</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
