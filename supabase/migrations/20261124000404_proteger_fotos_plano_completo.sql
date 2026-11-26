create policy "Plano completo pode enviar fotos da propria oficina"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'os-fotos'
  and (storage.foldername(name))[1] = public.minha_oficina_id()::text
  and public.plano_completo_ok()
);

create policy "Plano completo pode remover fotos da propria oficina"
on storage.objects for delete to authenticated
using (
  bucket_id = 'os-fotos'
  and (storage.foldername(name))[1] = public.minha_oficina_id()::text
  and public.plano_completo_ok()
);;
