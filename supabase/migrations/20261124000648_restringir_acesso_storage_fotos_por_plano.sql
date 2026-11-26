create policy "Plano completo exigido para arquivos de fotos das OS"
on storage.objects as restrictive
for all to authenticated
using (bucket_id <> 'os-fotos' or public.plano_completo_ok())
with check (bucket_id <> 'os-fotos' or public.plano_completo_ok());;
