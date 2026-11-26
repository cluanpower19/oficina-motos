CREATE OR REPLACE FUNCTION public.os_gerar_financeiro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF new.status = 'entregue'
     AND old.status IS DISTINCT FROM 'entregue'
     AND new.valor_total > 0
     AND EXISTS (
       SELECT 1
       FROM public.oficinas o
       WHERE o.id = new.oficina_id
         AND o.plano = 'completo'
         AND o.status_assinatura = 'ativo'
     )
  THEN
    INSERT INTO public.financeiro (oficina_id, tipo, descricao, valor, os_id, pago)
    VALUES (
      new.oficina_id,
      'entrada',
      'OS #' || new.numero || COALESCE(
        ' - ' || (SELECT c.nome FROM public.clientes c WHERE c.id = new.cliente_id),
        ''
      ),
      new.valor_total,
      new.id,
      false
    )
    ON CONFLICT (os_id) WHERE tipo = 'entrada' AND os_id IS NOT NULL
    DO NOTHING;
  END IF;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.os_gerar_financeiro() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.os_gerar_financeiro() FROM anon, authenticated;;
