"use server"

import { getCurrentUser } from "../lib/getCurrentUser"
import { createAdminClient } from "../server"

export async function addInviteeToRoom({
  roomId,
  email,
  //userId,
}: {
  roomId: string
  email: string
  //userId: string
}) {
  const currentUser = await getCurrentUser()
  if (currentUser == null) {
    return { error: true, message: "Inviter not authenticated" }
  }

  const supabase = createAdminClient()

  const { data: userProfile } = await supabase
    .from("user_profile")
    .select("id")
    .eq("email", email)
    .single()

  if (userProfile == null) {
    return { error: true, message: "User not found" }
  }

  const { data: existingMembership } = await supabase
    .from("chat_room_member")
    .select("member_id")
    .eq("chat_room_id", roomId)
    .eq("member_id", userProfile.id)
    .single()

  if (existingMembership) {
    return { error: true, message: "User is already a member of the room" }
  }

  const { error: insertError } = await supabase
    .from("chat_room_member")
    .insert({ chat_room_id: roomId, member_id: userProfile.id })

  if (insertError) {
    return { error: true, message: "Failed to add user to room" }
  }

  return { error: false, message: "User added to room successfully" } 
}
