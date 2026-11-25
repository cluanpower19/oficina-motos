-- Corrige regras do trial, baixa de estoque em finalizacao direta e imutabilidade de OS entregue.
-- Aplicar somente apos revisar o historico de migrations remoto.

-- Mantem a consulta do Plano Completo disponivel mesmo apos expiracao do trial/assinatura.
-- A restricao de escrita continua sendo aplicada por assinatura_ok() nas politicas de escrita.
CREATE OR REPLACE FUNCTION public.plano_completo_ok()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT coalesce((
    SELECT o.plano = 'completo'
      FROM public.oficinas AS o
     WHERE o.id = public.minha_oficina_id()
  ), false);
$function$;

REVOKE ALL ON FUNCTION public.plano_completo_ok() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plano_completo_ok() TO authenticated;

CREATE OR REPLACE FUNCTION public.os_gerar_financeiro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status = 'entregue'
     AND OLD.status IS DISTINCT FROM 'entregue'
     AND NEW.valor_total > 0
     AND EXISTS (
       SELECT 1
         FROM public.oficinas AS o
        WHERE o.id = NEW.oficina_id
          AND o.plano = 'completo'
          AND (
            o.status_assinatura = 'ativo'
            OR (
              o.status_assinatura = 'teste'
              AND o.teste_ate >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
            )
          )
     )
  THEN
    INSERT INTO public.financeiro (oficina_id, tipo, descricao, valor, os_id, pago)
    VALUES (
      NEW.oficina_id,
      'entrada',
      'OS #' || NEW.numero || COALESCE(
        ' - ' || (SELECT c.nome FROM public.clientes AS c WHERE c.id = NEW.cliente_id),
        ''
      ),
      NEW.valor_total,
      NEW.id,
      false
    )
    ON CONFLICT (os_id) WHERE tipo = 'entrada' AND os_id IS NOT NULL
    DO NOTHING;
  END IF;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.os_gerar_financeiro() FROM PUBLIC, anon, authenticated;

-- Se a OS for diretamente para Pronto ou Entregue, sem passar por Em andamento,
-- baixa as pecas uma unica vez. A baixa permanece atomica com a transicao de status.
CREATE OR REPLACE FUNCTION public.os_baixar_estoque_ao_finalizar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v record;
BEGIN
  IF NEW.status IN ('pronto', 'entregue')
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NOT NEW.estoque_baixado
  THEN
    FOR v IN
      SELECT i.peca_id, sum(i.quantidade)::integer AS quantidade
        FROM public.os_itens AS i
       WHERE i.os_id = NEW.id
         AND i.oficina_id = NEW.oficina_id
         AND i.peca_id IS NOT NULL
       GROUP BY i.peca_id
       ORDER BY i.peca_id
    LOOP
      UPDATE public.pecas AS p
         SET quantidade_estoque = p.quantidade_estoque - v.quantidade
       WHERE p.id = v.peca_id
         AND p.oficina_id = NEW.oficina_id
         AND p.quantidade_estoque >= v.quantidade;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Estoque insuficiente para finalizar esta ordem de servico.'
          USING ERRCODE = '23514';
      END IF;
    END LOOP;

    NEW.estoque_baixado := true;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.os_baixar_estoque_ao_finalizar() FROM PUBLIC, anon, authenticated;

-- Prefixo zz garante execucao depois de os_antes_atualizar_trg, que protege o flag interno.
DROP TRIGGER IF EXISTS os_baixar_estoque_ao_finalizar_trg ON public.ordens_servico;
DROP TRIGGER IF EXISTS zz_os_baixar_estoque_ao_finalizar_trg ON public.ordens_servico;
CREATE TRIGGER zz_os_baixar_estoque_ao_finalizar_trg
BEFORE UPDATE OF status ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.os_baixar_estoque_ao_finalizar();

-- Uma OS entregue fica imutavel tambem no banco, nao apenas na interface.
CREATE OR REPLACE FUNCTION public.os_bloquear_alteracao_entregue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF OLD.status = 'entregue' THEN
    RAISE EXCEPTION 'Esta OS ja foi entregue e nao pode mais ser alterada.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.os_bloquear_alteracao_entregue() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zz_os_bloquear_alteracao_entregue_trg ON public.ordens_servico;
CREATE TRIGGER zz_os_bloquear_alteracao_entregue_trg
BEFORE UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.os_bloquear_alteracao_entregue();

-- OS entregue e seu historico financeiro nao podem ser alterados por mudancas nos itens.
CREATE OR REPLACE FUNCTION public.os_itens_bloquear_entregue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_entregue boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM o.id
      FROM public.ordens_servico AS o
     WHERE o.id = NEW.os_id
     FOR UPDATE;

    SELECT coalesce(o.status = 'entregue', false)
      INTO v_entregue
      FROM public.ordens_servico AS o
     WHERE o.id = NEW.os_id;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM o.id
      FROM public.ordens_servico AS o
     WHERE o.id = OLD.os_id
     FOR UPDATE;

    SELECT coalesce(o.status = 'entregue', false)
      INTO v_entregue
      FROM public.ordens_servico AS o
     WHERE o.id = OLD.os_id;
  ELSE
    PERFORM o.id
      FROM public.ordens_servico AS o
     WHERE o.id IN (OLD.os_id, NEW.os_id)
     ORDER BY o.id
     FOR UPDATE;

    SELECT EXISTS (
      SELECT 1
        FROM public.ordens_servico AS o
       WHERE o.id IN (OLD.os_id, NEW.os_id)
         AND o.status = 'entregue'
    )
    INTO v_entregue;
  END IF;

  IF v_entregue THEN
    RAISE EXCEPTION 'Esta OS ja foi entregue e nao pode mais ter seus itens alterados.'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.os_itens_bloquear_entregue() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS os_itens_bloquear_entregue_trg ON public.os_itens;
CREATE TRIGGER os_itens_bloquear_entregue_trg
BEFORE INSERT OR UPDATE OR DELETE ON public.os_itens
FOR EACH ROW
EXECUTE FUNCTION public.os_itens_bloquear_entregue();
