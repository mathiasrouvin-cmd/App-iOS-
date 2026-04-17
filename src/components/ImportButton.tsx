import { useRef, useState } from 'react'
import { readFile } from '../csv'
import { useStore } from '../store'

export default function ImportButton() {
  const { importFromText } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  const onFile = async (file: File) => {
    const text = await readFile(file)
    const { added } = importFromText(text)
    setToast(added === 0 ? 'Aucune nouvelle transaction' : `${added} transaction${added > 1 ? 's' : ''} importée${added > 1 ? 's' : ''}`)
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <>
      <button
        className="nav-btn right"
        onClick={() => inputRef.current?.click()}
        aria-label="Importer un CSV"
      >
        Importer
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        hidden
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
