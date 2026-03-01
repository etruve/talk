import React, { Ref, useState } from 'react'

type Props = {
  text: string
}

export function NotesMessage({  text }: Props) {
  const [isRevealed, setIsRevealed] = useState(false)
    const [aiResponse, setAiResponse] = useState('')

  const analyzeText = async () => {
    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      })
      const data = await res.json()
      setAiResponse(data.response)
    } catch (error) {
      console.error('AI analysis failed:', error)
    }
  }
  

  
  return (
              <p className="text-sm wrap-break-words whitespace-pre">{text}</p>
  )
}