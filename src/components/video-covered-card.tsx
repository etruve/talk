import { cn } from "@/lib/utils"
import { Message } from "@/services/supabase/actions/messages"
import { Ref, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

type Props = {
  roomId: string
}
          
export function VideoCoveredCard(){
  const [message, setMessage] = useState("")
  const [isRevealed, setIsRevealed] = useState(false)
  return (
  <>
        <Card className="absolute inset-0 z-10 shadow-lg bg-linear-to-br from-gray-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Hidden Text</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-gray-600">
            Detailed description revealed when video moves up.
          </CardContent>
        </Card>

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
</>
  )
}


