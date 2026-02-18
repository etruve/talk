-- Option 1: Simple version - just drop the trigger if it exists
-- Run this FIRST to remove any problematic trigger
drop trigger if exists broadcast_message_insert on public.message;
drop function if exists public.broadcast_message_insert();

-- Option 2: Create a safe trigger that won't break INSERTs
-- This version will allow INSERTs to succeed even if broadcasting fails

create or replace function public.broadcast_message_insert()
returns trigger as $$
declare
  author_name text;
  author_image_url text;
begin
  -- Get author info safely
  select name, image_url
  into author_name, author_image_url
  from public.user_profile
  where id = new.author_id;

  -- Only try to broadcast if realtime extension exists
  -- Wrap in exception handler so INSERT never fails
  begin
    -- Check if realtime schema exists before using it
    if exists (select 1 from pg_namespace where nspname = 'realtime') then
      perform realtime.send(
        format('room:%s:messages', new.chat_room_id),
        'INSERT',
        jsonb_build_object(
          'id', new.id,
          'text', new.text,
          'created_at', new.created_at,
          'author_id', new.author_id,
          'author_name', coalesce(author_name, 'Unknown'),
          'author_image_url', author_image_url
        ),
        false
      );
    end if;
  exception when others then
    -- Silently ignore broadcast errors - don't fail the INSERT
    null;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger broadcast_message_insert
after insert on public.message
for each row
execute function public.broadcast_message_insert();
