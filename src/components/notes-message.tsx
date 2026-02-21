import React, { Ref, useState } from 'react'
import Image from "next/image"
import { Message } from 'react-hook-form'

type Props = {
  text: string
}

export function NotesMessage({
  text
}: Props) {
  const [isRevealed, setIsRevealed] = useState(false)
  
  return (
              <p className="text-sm wrap-break-words whitespace-pre">{text}</p>
  )
}