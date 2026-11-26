-- 0014_privar_bucket_os_fotos.sql
-- As fotos deixam de ser publicamente recuperáveis por URL permanente.
-- O acesso passa a ocorrer por URLs assinadas de curta duração.
update storage.buckets
set public = false
where id = 'os-fotos';
;
