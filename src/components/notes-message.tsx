import React, { Ref, useState } from 'react'
import { Button } from './ui/button'
import { Lightbulb, Sparkles, Zap } from 'lucide-react'
import { The_Nautigal } from 'next/font/google'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

type Props = {
  text: string
}

export function NotesMessage({  text }: Props) {
  const [isRevealed, setIsRevealed] = useState(false)
  //const [aiResponse, setAiResponse] = useState('')
  // Smart mock responses
  const getMockResponse = (text: string): string => {
  if (!text.trim()) return "Empty message - nothing to analyze."
  if (text.length > 100) return "Long message with detailed content."
  if (/[äöüß]/.test(text)) return "Contains special characters (Nordic languages)."
  if (text.match(/[a-zA-Z0-9]+/g)?.length === 1) return "Single word message."
  
  return "This appears to be casual conversation or test input. Neutral sentiment detected."
}


  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const analyzeText = async () => {
    if (1===1) {
      const mockResponse = getMockResponse(text)
      setAiResponse(mockResponse)
    } else {
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
}

return (
  <div className="space-y-1 p-3 border rounded-lg">
    <p className="text-sm whitespace-pre-wrap wrap-break-word">{text}</p>
    
    <Button onClick={analyzeText} variant="outline" size="sm">
      <Zap className="w-5 h-5" /> Ask AI to analyze
    </Button>
    
{aiResponse && (
<Card className="mt-2 border-border/50 shadow-sm flex flex-row items-start gap-1 p-2 h-fit">
  <div className="shrink-0 pt-1">
    <Lightbulb className="w-4 h-4" />
  </div>
  <div className="min-w-0 flex-1">
    <p className="text-sm text-foreground leading-relaxed">{aiResponse}</p>
  </div>
</Card>
)}
  </div>
)
} 