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

const getMockResponse = (text: string): string => {
  if (!text.trim()) return "Empty message - nothing to analyze."
  if (text.length > 100) return "Long message with detailed content."
  if (/[õüäöüß]/.test(text)) return "Contains special characters (Nordic languages)."
  if (text.match(/[a-zA-Z0-9]+/g)?.length === 1) return "Single word message."
  if (/https?:\/\//.test(text)) return "Contains URL/link - sharing external content."
  if (/\d/.test(text) && text.length < 20) return "Short numeric content (phone, code, date)."
  if (/[.!?]{2,}/.test(text)) return "High emphasis/exclamation - strong emotion detected."
  if (text.includes("@")) return "Mentions user/email - direct addressing."
  if (/emoji|😀|😂|❤️/.test(text)) return "Casual/emoji usage - friendly informal tone."
  if (text.match(/[A-Z]{2,}/g)) return "Shouting detected - ALL CAPS emphasis."
  if (/urgent|help|ASAP/i.test(text)) return "Urgent tone - needs immediate attention."
  if (text.includes("error") || text.includes("bug")) return "Technical issue mentioned."
  if (/supabase|aws|docker/i.test(text)) return "Developer terminology - tech discussion."
  if (text.match(/[^\w\s]/g)?.length! / text.length > 0.3) return "Heavy punctuation - excited/formal."
  
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

const getMainTopic = (text: string): string => 
  text.match(/[\p{L}\p{N}]{4,}/gu)
    ?.slice(0,2)
    ?.join(', ') || 'casual chat'

return (
  <div className="space-y-1 p-3 border rounded-lg">
    <p className="text-sm whitespace-pre-wrap wrap-break-word">{text}</p>
    
    <Button onClick={analyzeText} variant="outline" size="sm">
      <Zap className="w-5 h-5" /> Ask this?
    </Button>
    
{aiResponse && (
<Card className="mt-2 border-border/50 shadow-sm flex flex-row items-start gap-1 p-2 h-fit">
  <div className="shrink-0 pt-1">
    <Lightbulb className="w-4 h-4" />
  </div>
  <div className="min-w-0 flex-1">
    <p className="text-sm text-foreground leading-relaxed">{aiResponse}</p>
    <p className="text-sm text-foreground leading-relaxed">Topic: {getMainTopic(text)}</p>
  </div>
</Card>

)}
  </div>
)
} 