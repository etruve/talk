import { cn } from "@/lib/utils"
import { Message } from "@/services/supabase/actions/messages"
import { Ref, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { createClient } from "@/services/supabase/client"

type Props = {
  roomId: string
}

const supabase = createClient();

const { data:otherData } = supabase.storage
  .from("cat")
  .getPublicUrl("Moment.mp4");
const otherUrl = otherData.publicUrl;

const { data:catData } = supabase.storage
  .from("cat")
  .getPublicUrl("cat.mp4");
const catUrl = catData.publicUrl;

const { data:sound1Data } = supabase.storage
  .from("cat")
  .getPublicUrl("Roots.mp3");
const sound1Url = sound1Data.publicUrl;

const { data:sound2Data } = supabase.storage
  .from("cat")
  .getPublicUrl("Right.mp3");
const sound2Url = sound2Data.publicUrl;

export function VideoCoveredCard(){
  const [message, setMessage] = useState("")
  const [isRevealed, setIsRevealed] = useState(false)
return (
  <div className="w-full h-screen flex items-center justify-center p-2">
    <div className="relative w-full max-w-md h-96">


      <Card
        className={`absolute inset-x-0 top-0 z-10 p-0 shadow-2xl transition-all duration-50 ease-out ${
          isRevealed ? "-translate-y-10 rounded-b-none" : "cursor-pointer"
        }`}
        onClick={() => setIsRevealed(!isRevealed)}
      >
        <CardContent className="p-0">
          <audio
            className="w-full h-16 object-cover rounded-lg"
            controls
            src={sound1Url}
          >
          </audio>
          <audio
            className="w-full h-16 object-cover rounded-lg"
            controls
            src={sound2Url}
          >
          </audio>
        <video
            className="w-full h-64 object-cover rounded-lg"
            controls
            src={catUrl}
          >
            Your browser doesn't support video.
          </video>
          <video
            className="w-full h-64 object-cover rounded-lg"
            controls
            src={otherUrl}
          >
            Your browser doesn't support video.
          </video>
        </CardContent>
      </Card>
    </div>
  </div>
);
}


