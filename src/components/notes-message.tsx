import React, { Ref, useState } from 'react'
import { Button } from './ui/button'
import { Zap } from 'lucide-react'

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
  <div className="space-y-2 p-3 border rounded-lg">
    <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
    
    <Button onClick={analyzeText} variant="outline" size="sm">
      <Zap className="w-4 h-4" /> Ask AI to analyze
    </Button>
    
    {aiResponse && (
      <div className="mt-3 p-4 bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-2 h-2 mt-1 shrink-0" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">AI Analysis</span>
        </div>
        <p className="text-sm text-gray-900 leading-relaxed">{aiResponse}</p>
      </div>
    )}
  </div>
)
}