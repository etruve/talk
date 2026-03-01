import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    // ✅ ONE body read only!
    const { text } = await req.json()  // Read JSON once
    console.log('📝 Text to analyze:', text)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ 
        role: 'user', 
        content: `Analyze this chat message: "${text}"` 
      }],
    })
    
    const aiText = response.choices[0].message.content
    console.log('✅ AI response:', aiText)
    
    return NextResponse.json({ 
      response: aiText 
    })
    
  } catch (error: any) {
    console.error('❌ OpenAI ERROR:', error.message)
    
    return NextResponse.json({ 
      error: error.message || 'AI service failed'
    }, { status: 500 })
  }
}
