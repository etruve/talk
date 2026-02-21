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
  const [message, setMessage] = useState("")
  const [isRevealed, setIsRevealed] = useState(false)
  return (
    <div className="w-1/2 border-r flex flex-col items-center justify-center text-white ">
      <div className="w-14 h-14 bg-white/20 rounded-full mb-6 flex items-center justify-center">
        🎤
      </div>
        <div className="relative w-87.5 h-64">
        {/* Back Card (Text) - Behind */}
        <Card className="absolute inset-0 z-10 shadow-lg bg-linear-to-br from-gray-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Hidden Text</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-gray-600">
            Detailed description revealed when video moves up.
          </CardContent>
        </Card>

        {/* Front Card (Video) - On Top */}
        <Card
          className={`p-0 absolute inset-x-0 top-0 z-20 shadow-2xl transition-all duration-500 ease-out hover:shadow-3xl ${
            isRevealed ? '-translate-y-60 rounded-b-none' : 'cursor-pointer'
          }`}
          onClick={() => setIsRevealed(!isRevealed)}
        >
          <CardContent className="p-0" >
            <video
              className="w-full h-64 object-cover rounded-lg"
              controls
              src="/your-video.mp4"
            >
              Your browser doesn't support video.
            </video>
          </CardContent>
        </Card>
      </div>
      <div className="text-xl m-8 opacity-90">Me talking</div>
    </div>

  )
}
function useRealtimeChat(arg0: { roomId: string; userId: string }): { connectedUsers: any; messages: any } {
    throw new Error("Function not implemented.")
}

