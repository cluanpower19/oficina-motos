insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "logos: dono envia na pasta da oficina" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and public.sou_dono() and (storage.foldername(name))[1] = public.minha_oficina_id()::text);
create policy "logos: dono atualiza na pasta da oficina" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and public.sou_dono() and (storage.foldername(name))[1] = public.minha_oficina_id()::text);
create policy "logos: dono apaga na pasta da oficina" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and public.sou_dono() and (storage.foldername(name))[1] = public.minha_oficina_id()::text);;
