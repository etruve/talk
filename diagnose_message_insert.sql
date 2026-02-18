-- Diagnostic script to check why message inserts might be failing

-- 1. Check if there are any triggers on the message table
SELECT 
  tgname as trigger_name,
  tgtype::text as trigger_type,
  proname as function_name,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.message'::regclass
  AND NOT tgisinternal;

-- 2. Check if the broadcast_message_insert function exists and its definition
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'broadcast_message_insert';

-- 3. Check if realtime extension exists
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'realtime'
) as realtime_extension_exists;

-- 4. Check if realtime schema exists
SELECT EXISTS (
  SELECT 1 FROM pg_namespace WHERE nspname = 'realtime'
) as realtime_schema_exists;

-- 5. Check if realtime.send function exists
SELECT EXISTS (
  SELECT 1 
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'realtime' AND p.proname = 'send'
) as realtime_send_exists;

-- 6. Test inserting a message manually (replace with actual values)
-- Uncomment and modify this to test:
-- INSERT INTO public.message (id, text, chat_room_id, author_id)
-- VALUES ('test-id', 'test message', 'your-room-id', 'your-user-id')
-- RETURNING *;
