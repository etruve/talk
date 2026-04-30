import { cn } from "@/lib/utils"
import { Message } from "@/services/supabase/actions/messages"
import { Ref, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

type Props = {
  roomId: string
}
          
export function VideoMessage({
  roomId,
  }: Props) {
  return (

    <div className="w-full h-screen flex flex-col items-center justify-center gap-4 p-6">

          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
        🎤
      </div>
      <div className="text-xl m-2 opacity-90">Me talking</div>
    </div>

  )
}
function useRealtimeChat(arg0: { roomId: string; userId: string }): { connectedUsers: any; messages: any } {
    throw new Error("Function not implemented.")
}

