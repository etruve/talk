import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,  // ✅ Secure in .env
})

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Analyze this message: ${text}` }],
    })
    
    return NextResponse.json({ 
      response: response.choices[0].message.content 
    })
  } catch (error) {
    return NextResponse.json({ error: 'AI failed' }, { status: 500 })
  }
}
