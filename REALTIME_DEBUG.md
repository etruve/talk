# Realtime Message Debugging Guide

## Current Status
- ✅ Messages can be inserted (trigger removed)
- ❌ Messages not appearing in real-time for other users

## Debugging Steps

### 1. Check Browser Console
Open your browser's DevTools Console and look for these logs:

- `[Realtime] Channel subscription status: SUBSCRIBED` - Should appear when you load the room
- `[Realtime] Received postgres_changes INSERT:` - Should appear when someone sends a message
- `[Realtime] Received broadcast INSERT:` - Should appear if broadcast is working
- `[UI] Message counts:` - Shows how many messages are in each state

### 2. Check if Realtime is Enabled on Message Table

**In Supabase Dashboard:**
1. Go to **Database** → **Replication** (or **Realtime**)
2. Find the `message` table
3. Make sure the toggle is **ON** (green/enabled)

If it's OFF, turn it ON. This is required for `postgres_changes` to work.

### 3. Test the Connection

Open the room in **two different browsers** (or normal + incognito):

1. **Browser 1**: Open the room, check console for `SUBSCRIBED` status
2. **Browser 2**: Open the same room, check console for `SUBSCRIBED` status
3. **Browser 1**: Send a message
4. **Browser 2**: Check console for `postgres_changes INSERT` log

### 4. Common Issues

#### Issue: No `SUBSCRIBED` status
**Cause**: Channel subscription failed
**Fix**: Check if you see `CHANNEL_ERROR` or `TIMED_OUT` in console. This might be:
- Authentication issue (check if user is logged in)
- Network issue
- Supabase Realtime service down

#### Issue: `SUBSCRIBED` but no `postgres_changes INSERT`
**Cause**: Realtime not enabled on `message` table OR RLS blocking
**Fix**: 
- Enable Realtime on `message` table in Supabase Dashboard
- Check RLS policies allow reading messages

#### Issue: Messages appear in console but not in UI
**Cause**: State update issue or deduplication problem
**Fix**: Check the `[UI] Message counts` log to see if messages are being added to state

### 5. Alternative: Use Broadcast Only

If `postgres_changes` doesn't work, you can rely on client-side broadcast:

1. When you send a message, it broadcasts to the channel
2. Other connected clients receive the broadcast
3. This works even without Realtime enabled on the table

**Limitation**: Only works for clients that are currently connected. If someone joins later, they won't see messages sent before they joined.

## Next Steps

1. **Check console logs** - What do you see?
2. **Enable Realtime on message table** - Did you do this?
3. **Test with two browsers** - Does it work?

Share the console output and we can fix the specific issue!
