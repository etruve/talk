"use client"

import { ChatInput } from "@/components/chat-input"
import { ChatMessage } from "@/components/chat-message"
import { InviteUserModal } from "@/components/invite-user-modal"
import { Button } from "@/components/ui/button"
import { Message } from "@/services/supabase/actions/messages"
import { createClient } from "@/services/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RoomClient({
  room,
  user,
  messages,
}: {
  user: {
    id: string
    name: string
    image_url: string | null
  }
  room: {
    id: string
    name: string
  }
  messages: Message[]
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { connectedUsers, messages: realtimeMessages } = useRealtimeChat({
    roomId: room.id,
    userId: user.id,
  })
 const {
  loadMoreMessages,
  messages: rawMessages,  // renamed
  status,
  triggerQueryRef,
} = useInfiniteScrollChat({
  roomId: room.id,
  startingMessages: messages,
})
  const [sentMessages, setSentMessages] = useState<
    (Message & { status: "pending" | "error" | "success" })[]
  >([])

const visibleMessages = useMemo(() => {
  const map = new Map();
  rawMessages.forEach(msg => map.set(msg.id, msg));
  return Array.from(map.values());
}, [rawMessages])

  return (
    <div className="h-screen container mx-auto h-screen-with-header flex flex-row min-h-0">

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
      <div className="text-xl m-8 opacity-90">Look who's talking</div>
    </div>
    
      <div className="m-16 grow overflow-y-auto flex flex-col"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
        }}
      >
      <ChatInput
        roomId={room.id}
        onSend={message => {
          setSentMessages(prev => [
            ...prev,
            {
              id: message.id,
              text: message.text,
              created_at: new Date().toISOString(),
              author_id: user.id,
              author: {
                name: user.name,
                image_url: user.image_url,
              },
              status: "pending",
            },
          ])
        }}
        onSuccessfulSend={message => {
          setSentMessages(prev =>
            prev.map(m =>
              m.id === message.id ? { ...message, status: "success" } : m
            )
          )
        }}
        onErrorSend={id => {
          setSentMessages(prev =>
            prev.map(m => (m.id === id ? { ...m, status: "error" } : m))
          )
        }}
      />    
        <div>
          {status === "loading" && (
            <p className="text-center text-sm text-muted-foreground py-2">
              Loading more messages...
            </p>
          )}
          {/* .toReversed()*/}
          {visibleMessages.toReversed().map((message, index) => (
            <ChatMessage
              key={message.id}
              {...message}
              ref={index === 0 && status === "idle" ? triggerQueryRef : null}
            />
          ))}
          {status === "error" && (
            <div className="text-center">
              <p className="text-sm text-destructive py-2">
                Error loading messages.
              </p>
              <Button onClick={loadMoreMessages} variant="outline">
                Retry
              </Button>
            </div>
          )}
        </div>      
      </div>
   


    </div>
  ) 
}

function useRealtimeChat({
  roomId,
  userId,
}: {
  roomId: string
  userId: string
}) {
  const [connectedUsers, setConnectedUsers] = useState(1)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const supabase = createClient()
    let newChannel: RealtimeChannel
    let cancel = false

    supabase.realtime.setAuth().then(() => {
      if (cancel) return

      newChannel = supabase.channel(`room:${roomId}:messages`, {
        config: {
          private: true,
          presence: {
            key: userId,
          },
        },
      })

      newChannel
        .on("presence", { event: "sync" }, () => {
          setConnectedUsers(Object.keys(newChannel.presenceState()).length)
        })
        .on("broadcast", { event: "INSERT" }, payload => {
          const record = payload.payload
          setMessages(prevMessages => [
            {
              id: record.id,
              text: record.text,
              created_at: record.created_at,
              author_id: record.author_id,
              author: {
                name: record.author_name,
                image_url: record.author_image_url,
              },
            },
          ...prevMessages,
          ])
        })
        .subscribe(status => {
          if (status !== "SUBSCRIBED") return

          newChannel.track({ userId })
        })
    })

    return () => {
      cancel = true
      if (!newChannel) return
      newChannel.untrack()
      newChannel.unsubscribe()
    }
  }, [roomId, userId])

  return { connectedUsers, messages }
}

const LIMIT = 25
function useInfiniteScrollChat({
  startingMessages,
  roomId,
}: {
  startingMessages: Message[]
  roomId: string
}) {
  const [messages, setMessages] = useState<Message[]>(startingMessages)
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    startingMessages.length === 0 ? "done" : "idle"
  )

  async function loadMoreMessages() {
    if (status === "done" || status === "loading") return
    const supabase = createClient()
    setStatus("loading")

    const { data, error } = await supabase
      .from("message")
      .select(
        "id, text, created_at, author_id, author:user_profile (name, image_url)"
      )
      .eq("chat_room_id", roomId)
      .lt("created_at", messages[0].created_at)
      .order("created_at", { ascending: false })
      .limit(LIMIT)

    if (error) {
      setStatus("error")
      return
    }

    setMessages(prev => [...data, ...prev])
    setStatus(data.length < LIMIT ? "done" : "idle")
  }

  function triggerQueryRef(node: HTMLDivElement | null) {
    if (node == null) return
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target === node) {
            observer.unobserve(node)
            loadMoreMessages()
          }
        })
      },
      {
        rootMargin: "50px",
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }

  return { loadMoreMessages, messages, status, triggerQueryRef }
}