-- Fix: Remove the problematic trigger that requires realtime extension
-- This will allow messages to insert successfully again

drop trigger if exists broadcast_message_insert on public.message;
drop function if exists public.broadcast_message_insert();

-- Messages should now insert successfully!
-- For realtime updates, we'll use the postgres_changes listener in the client
-- which works if Realtime is enabled on the message table in Supabase dashboard
