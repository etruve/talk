"use client"

import { ChatInput } from "@/components/chat-input"
import { ChatMessage } from "@/components/chat-message"
import { InviteUserModal } from "@/components/invite-user-modal"
import { Button } from "@/components/ui/button"
import { Message } from "@/services/supabase/actions/messages"
import { createClient } from "@/services/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useEffect, useMemo, useState } from "react"
import { VideoMessage } from "@/components/video-message"
import { NotesMessage } from "@/components/notes-message"
import { VideoCoveredCard } from "@/components/video-covered-card"

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
const { connectedUsers, messages: realtimeMessages } = useRealtimeChat({
    roomId: room.id,
    userId: user.id,
  })
  const {
    loadMoreMessages,
    messages: oldMessages,
    status,
    triggerQueryRef,
  } = useInfiniteScrollChat({
    roomId: room.id,
    startingMessages: messages.toReversed(),
  })
  const [sentMessages, setSentMessages] = useState<
    (Message & { status: "pending" | "error" | "success" })[]
  >([])

  const visibleMessages = oldMessages.concat(
    realtimeMessages,
    sentMessages.filter(m => !realtimeMessages.find(rm => rm.id === m.id))
  )

  return (
  <div className="w-full h-screen container mx-auto h-screen-with-header border-x flex flex-row min-h-0">
  <div className="m-2 grow overflow-y-auto flex flex-col items-center justify-center">
            <VideoCoveredCard 
            />

          {status === "error" && (
            <div className="text-center">
              <p className="text-sm text-destructive py-2">
                Error Video loading.
              </p>
            </div>
          )}
        <div className="flex border m-2 w-full">
          <div className="m-6"> 
          <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-muted-foreground text-sm">
              {connectedUsers} {connectedUsers === 1 ? "user" : "users"} online
            </p>
            <div className="mt-6"><InviteUserModal roomId={room.id} /></div>
        </div>  
      </div>
  </div>
    <div className="m-2 grow overflow-y-auto flex flex-col"
  style={{
    scrollbarWidth: "thin",
    scrollbarColor: "var(--border) transparent",
  }}
>

    {status === "loading" && (
      <p className="text-center text-sm text-muted-foreground py-2">
        Loading more messages...
      </p>
    )}
    {/* */}
    {visibleMessages.map((message) => (
      <NotesMessage
        key={message.id}
        text={message.text}
        
      /> 
    ))}
  </div>      
  <div className="m-2 grow overflow-y-auto flex flex-col"
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
          {/* */}
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
          //private: true,
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
            ...prevMessages,
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
          ])
        })
        
        .subscribe(status => {
          //console.log('NB STATUS:', status); // This requires JWT + RLS policy!
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

const LIMIT = 50
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