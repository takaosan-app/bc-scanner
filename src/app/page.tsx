'use client'

import { useState, useRef } from 'react'

type AIResult = {
  success: boolean
  data?: Record<string, string | null>
  error?: string
}

type ScanResult = {
  claude: AIResult
  gemini: AIResult
  openai: AIResult
}

type AIKey = keyof ScanResult

const FIELDS: { key: string; label: string }[] = [
  { key: 'name', label: '氏名' },
  { key: 'name_kana', label: 'ふりがな' },
  { key: 'company', label: '会社名' },
  { key: 'department', label: '部署' },
  { key: 'title', label: '役職' },
  { key: 'email', label: 'メール' },
  { key: 'phone', label: '電話' },
  { key: 'mobile', label: '携帯' },
  { key: 'fax', label: 'FAX' },
  { key: 'postcode', label: '郵便番号' },
  { key: 'address', label: '住所' },
  { key: 'website', label: 'Web' },
  { key: 'sns', label: 'SNS' },
]

const AI_TABS: { key: AIKey; label: string; activeClass: string }[] = [
  { key: 'claude', label: 'Claude', activeClass: 'bg-orange-500 text-white' },
  { key: 'gemini', label: 'Gemini', activeClass: 'bg-blue-500 text-white' },
  { key: 'openai', label: 'ChatGPT', activeClass: 'bg-green-500 text-white' },
]

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [activeAI, setActiveAI] = useState<AIKey>('claude')
  const [showJson, setShowJson] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (f: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(f)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX_PX = 1920
        const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)

        const tryQuality = (quality: number) => {
          canvas.toBlob((blob) => {
            if (!blob) return resolve(f)
            if (blob.size <= 1.5 * 1024 * 1024 || quality <= 0.4) {
              resolve(new File([blob], f.name, { type: 'image/jpeg' }))
            } else {
              tryQuality(quality - 0.1)
            }
          }, 'image/jpeg', quality)
        }
        tryQuality(0.85)
      }
      img.src = url
    })
  }

  const handleFile = (f: File) => {
    setResult(null)
    setShowJson(false)
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target?.result as string)
    reader.readAsDataURL(f)
    compressImage(f).then(setFile)
  }

  const handleScan = async () => {
    if (!file) return
    setScanning(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/bc/api/scan', { method: 'POST', body: formData })
      const data: ScanResult = await res.json()
      setResult(data)
    } finally {
      setScanning(false)
    }
  }

  const reset = () => {
    setImage(null)
    setFile(null)
    setResult(null)
    setShowJson(false)
  }

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-center mb-5 text-gray-800">名刺スキャナー</h1>

      {!image ? (
        <div className="space-y-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full h-44 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">カメラで撮影</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 bg-white hover:bg-gray-50 transition-colors"
          >
            ファイルから選択
          </button>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-gray-100">
            <img src={image} alt="名刺" className="w-full object-contain max-h-52" />
            {!scanning && (
              <button onClick={reset} className="absolute top-2 right-2 w-7 h-7 bg-black/40 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/60">
                ✕
              </button>
            )}
          </div>

          {!result && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-60 hover:bg-blue-700 transition-colors"
            >
              {scanning ? '解析中...' : 'AIで読み取る'}
            </button>
          )}

          {scanning && (
            <div className="space-y-2">
              {AI_TABS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-sm text-gray-500">{label} 解析中...</span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {AI_TABS.map(({ key, label, activeClass }) => (
                  <button
                    key={key}
                    onClick={() => { setActiveAI(key); setShowJson(false) }}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      activeAI === key ? activeClass + ' border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                    {result[key].success ? (
                      <span className="ml-1 text-xs opacity-70">✓</span>
                    ) : (
                      <span className="ml-1 text-xs text-red-400">✗</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                {result[activeAI].success && result[activeAI].data ? (
                  <>
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => setShowJson(!showJson)}
                        className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-0.5"
                      >
                        {showJson ? '整形表示' : 'JSON'}
                      </button>
                    </div>
                    {showJson ? (
                      <pre className="text-xs text-gray-600 overflow-auto bg-gray-50 rounded p-3 max-h-72">
                        {JSON.stringify(result[activeAI].data, null, 2)}
                      </pre>
                    ) : (
                      <div className="space-y-2">
                        {FIELDS.filter(({ key }) => result[activeAI].data![key]).map(({ key, label }) => (
                          <div key={key} className="flex gap-3">
                            <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">{label}</span>
                            <span className="text-sm text-gray-800 break-all">{result[activeAI].data![key]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-red-500">{result[activeAI].error ?? 'エラーが発生しました'}</p>
                )}
              </div>

              <button onClick={reset} className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 bg-white hover:bg-gray-50">
                別の名刺を読み取る
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
