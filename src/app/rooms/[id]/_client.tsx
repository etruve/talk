"use client"

import { ChatInput } from "@/components/chat-input"
import { ChatMessage } from "@/components/chat-message"
import { InviteUserModal } from "@/components/invite-user-modal"
import { Button } from "@/components/ui/button"
import { Message } from "@/services/supabase/actions/messages"
import { createClient } from "@/services/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
   import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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
  const { connectedUsers, messages: realtimeMessages, broadcastMessage } =
    useRealtimeChat({
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

  // Merge and deduplicate all messages, sorted by created_at
  const visibleMessages = useMemo(() => {
    // Combine all message sources
    const allMessages = [
      ...oldMessages,
      ...realtimeMessages,
      ...sentMessages.filter(m => m.status === "pending" || m.status === "success"),
    ]

    // Deduplicate by id, keeping the most recent version
    const messageMap = new Map<string, Message>()
    for (const msg of allMessages) {
      const existing = messageMap.get(msg.id)
      if (!existing || new Date(msg.created_at) > new Date(existing.created_at)) {
        messageMap.set(msg.id, msg)
      }
    }

    // Sort by created_at descending (newest first, since we're using flex-col-reverse)
    const sorted = Array.from(messageMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log("[UI] Merged messages:", {
      oldMessages: oldMessages.length,
      realtimeMessages: realtimeMessages.length,
      sentMessages: sentMessages.length,
      totalUnique: sorted.length,
      messageIds: sorted.map(m => m.id).slice(0, 5),
    })

    return sorted
  }, [oldMessages, realtimeMessages, sentMessages])

  return (
    <div className="container mx-auto h-screen-with-header border border-y-0 flex flex-col">
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="border-b">
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="text-muted-foreground text-sm">
            {connectedUsers} {connectedUsers === 1 ? "user" : "users"} online
          </p>
        </div>
        <InviteUserModal roomId={room.id} />
      </div>
      <div
        className="grow overflow-y-auto flex flex-col-reverse"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
        }}
      >
        <div>
          {status === "loading" && (
            <p className="text-center text-sm text-muted-foreground py-2">
              Loading more messages...
            </p>
          )}
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
          {visibleMessages.length === 0 && status === "idle" && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No messages yet. Start the conversation!
            </p>
          )}
          {visibleMessages.map((message, index) => (
            <ChatMessage
              key={`${message.id}-${message.created_at}`}
              {...message}
              ref={index === 0 && status === "idle" ? triggerQueryRef : null}
            />
          ))}
        </div>
      </div>
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
          broadcastMessage(message)
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
  const channelRef = useRef<RealtimeChannel | null>(null)
  const subscribedRef = useRef(false)
  const pendingBroadcastsRef = useRef<
    Array<{
      id: string
      text: string
      created_at: string
      author_id: string
      author_name: string
      author_image_url: string | null
    }>
  >([])

  const broadcastMessage = useCallback((message: Message) => {
    const payload = {
      id: message.id,
      text: message.text,
      created_at: message.created_at,
      author_id: message.author_id,
      author_name: message.author.name,
      author_image_url: message.author.image_url,
    }

    const channel = channelRef.current
    if (!channel || !subscribedRef.current) {
      pendingBroadcastsRef.current.push(payload)
      return
    }

    channel.send({ type: "broadcast", event: "INSERT", payload })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let newChannel: RealtimeChannel
    let cancel = false

    setConnectedUsers(1)
    setMessages([])
    subscribedRef.current = false
    pendingBroadcastsRef.current = []

    ;(async () => {
      const { data } = await supabase.auth.getSession()
      await supabase.realtime.setAuth(data.session?.access_token ?? "")
      if (cancel) return

      newChannel = supabase.channel(`room:${roomId}:messages`, {
        config: {
          private: true,
          presence: {
            key: userId,
          },
        },
      })
      channelRef.current = newChannel

      newChannel
        .on("presence", { event: "sync" }, () => {
          setConnectedUsers(Object.keys(newChannel.presenceState()).length)
        })
        .on("broadcast", { event: "INSERT" }, async payload => {
          console.log("[Realtime] Received broadcast INSERT:", payload)
          const record = payload.payload as Partial<{
            id: string
            text: string
            created_at: string
            author_id: string
            author_name: string
            author_image_url: string | null
          }>

          if (!record.id || !record.text || !record.created_at || !record.author_id) {
            console.warn("[Realtime] Invalid broadcast payload:", record)
            return
          }

          let author:
            | { name: string; image_url: string | null }
            | null
            | undefined = null

          if (record.author_name != null) {
            author = { name: record.author_name, image_url: record.author_image_url ?? null }
          } else {
            const res = await supabase
              .from("user_profile")
              .select("name, image_url")
              .eq("id", record.author_id)
              .single()
            author = res.data
          }

          if (cancel) return
          
          const newMessage: Message = {
            id: record.id,
            text: record.text,
            created_at: record.created_at,
            author_id: record.author_id,
            author: {
              name: author?.name ?? "Unknown",
              image_url: author?.image_url ?? null,
            },
          }
          
          console.log("[Realtime] Adding broadcast message to state:", record.id, newMessage)
          setMessages(prevMessages => {
            if (prevMessages.some(m => m.id === record.id)) {
              console.log("[Realtime] Broadcast message already exists, skipping:", record.id)
              return prevMessages
            }
            console.log("[Realtime] Adding new broadcast message, total:", prevMessages.length + 1)
            return [...prevMessages, newMessage]
          })
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message",
            filter: `chat_room_id=eq.${roomId}`,
          },
          async payload => {
            console.log("[Realtime] Received postgres_changes INSERT:", payload)
            const record = payload.new as {
              id: string
              text: string
              created_at: string
              author_id: string
            }

            const { data: author } = await supabase
              .from("user_profile")
              .select("name, image_url")
              .eq("id", record.author_id)
              .single()

            if (cancel) return
            
            const newMessage: Message = {
              id: record.id,
              text: record.text,
              created_at: record.created_at,
              author_id: record.author_id,
              author: {
                name: author?.name ?? "Unknown",
                image_url: author?.image_url ?? null,
              },
            }
            
            console.log("[Realtime] Adding message to state:", record.id, newMessage)
            setMessages(prevMessages => {
              // Check if message already exists
              if (prevMessages.some(m => m.id === record.id)) {
                console.log("[Realtime] Message already exists in realtimeMessages, skipping:", record.id)
                return prevMessages
              }
              
              console.log("[Realtime] Adding new message to realtimeMessages, total:", prevMessages.length + 1)
              // Add to the end (newest messages)
              return [...prevMessages, newMessage]
            })
          }
        )
        .subscribe((status, err) => {
          console.log(`[Realtime] Channel subscription status: ${status}`, err || "")
          
          if (status === "SUBSCRIBED") {
            subscribedRef.current = true
            const pending = pendingBroadcastsRef.current
            pendingBroadcastsRef.current = []
            pending.forEach(payload => {
              newChannel.send({ type: "broadcast", event: "INSERT", payload })
            })
            newChannel.track({ userId })
            console.log(`[Realtime] Successfully subscribed to room:${roomId}:messages`)
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`[Realtime] Channel error: ${status}`, err)
          }
        })
    })()

    return () => {
      cancel = true
      if (!newChannel) return
      newChannel.untrack()
      newChannel.unsubscribe()
      supabase.removeChannel(newChannel)
      if (channelRef.current === newChannel) channelRef.current = null
    }
  }, [roomId, userId])

  return { connectedUsers, messages, broadcastMessage }
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

    setMessages(prev => [...data.toReversed(), ...prev])
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
