import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

const PROMPT = `この名刺画像から情報を抽出し、以下のJSON形式のみで返してください。他の文章は不要です。
{
  "name": "氏名",
  "name_kana": "氏名（ふりがな）",
  "company": "会社名",
  "department": "部署名",
  "title": "役職",
  "email": "メールアドレス",
  "phone": "電話番号（固定）",
  "mobile": "携帯電話番号",
  "fax": "FAX番号",
  "postcode": "郵便番号",
  "address": "住所",
  "website": "WebサイトURL",
  "sns": "SNSアカウント"
}
見つからない項目はnullにしてください。`

function parseJson(text: string): Record<string, string | null> {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(cleaned)
}

async function scanWithClaude(base64: string, mimeType: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 } },
        { type: 'text', text: PROMPT },
      ],
    }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseJson(text)
}

async function scanWithGemini(base64: string, mimeType: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })
  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType } },
    PROMPT,
  ])
  return parseJson(result.response.text())
}

async function scanWithOpenAI(base64: string, mimeType: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.create({
    model: 'gpt-5.4-nano',
    max_completion_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: PROMPT },
      ],
    }],
  })
  const text = response.choices[0].message.content ?? ''
  return parseJson(text)
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = file.type

  const [claude, gemini, openai] = await Promise.allSettled([
    scanWithClaude(base64, mimeType),
    scanWithGemini(base64, mimeType),
    scanWithOpenAI(base64, mimeType),
  ])

  return NextResponse.json({
    claude: claude.status === 'fulfilled'
      ? { success: true, data: claude.value }
      : { success: false, error: String(claude.reason) },
    gemini: gemini.status === 'fulfilled'
      ? { success: true, data: gemini.value }
      : { success: false, error: String(gemini.reason) },
    openai: openai.status === 'fulfilled'
      ? { success: true, data: openai.value }
      : { success: false, error: String(openai.reason) },
  })
}
