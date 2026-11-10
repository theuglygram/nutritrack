-- Private bucket for meal photos (ARCHITECTURE.md §7). Object paths: {user_id}/{uuid}.jpg
-- The 30-day automatic deletion (ADR-021) is added with photo recognition in Stage 11.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  5242880, -- 5 MiB; photos are compressed on device before upload
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "meal-photos: owner reads"
  on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "meal-photos: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "meal-photos: owner updates"
  on storage.objects for update to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "meal-photos: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
