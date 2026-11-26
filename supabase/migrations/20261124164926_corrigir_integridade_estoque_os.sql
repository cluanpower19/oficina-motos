-- 0018_corrigir_integridade_estoque_os.sql
-- Protege o estoque, impede relações entre oficinas diferentes e limita
-- os campos de OS que o cliente pode inserir/alterar.
SET lock_timeout = '5s';
SET statement_timeout = '120s';

-- Chaves únicas compostas necessárias para garantir a oficina de cada relação.
CREATE UNIQUE INDEX IF NOT EXISTS clientes_id_oficina_uidx
  ON public.clientes (id, oficina_id);
CREATE UNIQUE INDEX IF NOT EXISTS motos_id_oficina_uidx
  ON public.motos (id, oficina_id);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_id_oficina_uidx
  ON public.usuarios (id, oficina_id);
CREATE UNIQUE INDEX IF NOT EXISTS ordens_servico_id_oficina_uidx
  ON public.ordens_servico (id, oficina_id);
CREATE UNIQUE INDEX IF NOT EXISTS pecas_id_oficina_uidx
  ON public.pecas (id, oficina_id);

-- Cada vínculo precisa apontar para um registro da mesma oficina.
ALTER TABLE public.motos
  ADD CONSTRAINT motos_cliente_oficina_fk
  FOREIGN KEY (cliente_id, oficina_id)
  REFERENCES public.clientes (id, oficina_id)
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.ordens_servico
  ADD CONSTRAINT ordens_servico_cliente_oficina_fk
  FOREIGN KEY (cliente_id, oficina_id)
  REFERENCES public.clientes (id, oficina_id)
  ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.ordens_servico
  ADD CONSTRAINT ordens_servico_moto_oficina_fk
  FOREIGN KEY (moto_id, oficina_id)
  REFERENCES public.motos (id, oficina_id)
  ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.ordens_servico
  ADD CONSTRAINT ordens_servico_mecanico_oficina_fk
  FOREIGN KEY (mecanico_id, oficina_id)
  REFERENCES public.usuarios (id, oficina_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE public.os_fotos
  ADD CONSTRAINT os_fotos_os_oficina_fk
  FOREIGN KEY (os_id, oficina_id)
  REFERENCES public.ordens_servico (id, oficina_id)
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.os_itens
  ADD CONSTRAINT os_itens_os_oficina_fk
  FOREIGN KEY (os_id, oficina_id)
  REFERENCES public.ordens_servico (id, oficina_id)
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.os_itens
  ADD CONSTRAINT os_itens_peca_oficina_fk
  FOREIGN KEY (peca_id, oficina_id)
  REFERENCES public.pecas (id, oficina_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE public.financeiro
  ADD CONSTRAINT financeiro_os_oficina_fk
  FOREIGN KEY (os_id, oficina_id)
  REFERENCES public.ordens_servico (id, oficina_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;

ALTER TABLE public.lembretes
  ADD CONSTRAINT lembretes_moto_oficina_fk
  FOREIGN KEY (moto_id, oficina_id)
  REFERENCES public.motos (id, oficina_id)
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.motos VALIDATE CONSTRAINT motos_cliente_oficina_fk;
ALTER TABLE public.ordens_servico VALIDATE CONSTRAINT ordens_servico_cliente_oficina_fk;
ALTER TABLE public.ordens_servico VALIDATE CONSTRAINT ordens_servico_moto_oficina_fk;
ALTER TABLE public.ordens_servico VALIDATE CONSTRAINT ordens_servico_mecanico_oficina_fk;
ALTER TABLE public.os_fotos VALIDATE CONSTRAINT os_fotos_os_oficina_fk;
ALTER TABLE public.os_itens VALIDATE CONSTRAINT os_itens_os_oficina_fk;
ALTER TABLE public.os_itens VALIDATE CONSTRAINT os_itens_peca_oficina_fk;
ALTER TABLE public.financeiro VALIDATE CONSTRAINT financeiro_os_oficina_fk;
ALTER TABLE public.lembretes VALIDATE CONSTRAINT lembretes_moto_oficina_fk;

-- O estoque e o estoque mínimo nunca podem ser negativos.
ALTER TABLE public.pecas
  ADD CONSTRAINT pecas_quantidade_estoque_nonnegative
  CHECK (quantidade_estoque >= 0) NOT VALID;
ALTER TABLE public.pecas
  ADD CONSTRAINT pecas_estoque_minimo_nonnegative
  CHECK (estoque_minimo >= 0) NOT VALID;
ALTER TABLE public.os_itens
  ADD CONSTRAINT os_itens_peca_tipo_check
  CHECK (peca_id IS NULL OR tipo = 'peca') NOT VALID;

ALTER TABLE public.pecas VALIDATE CONSTRAINT pecas_quantidade_estoque_nonnegative;
ALTER TABLE public.pecas VALIDATE CONSTRAINT pecas_estoque_minimo_nonnegative;
ALTER TABLE public.os_itens VALIDATE CONSTRAINT os_itens_peca_tipo_check;

-- A baixa inicial é atômica: qualquer peça sem saldo cancela a transição inteira.
-- O cliente não pode alterar estoque_baixado diretamente.
CREATE OR REPLACE FUNCTION public.os_antes_atualizar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v record;
BEGIN
  IF NEW.estoque_baixado IS DISTINCT FROM OLD.estoque_baixado THEN
    RAISE EXCEPTION 'O controle de baixa do estoque é interno.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status = 'aprovado' AND NEW.aprovado_em IS NULL THEN
    NEW.aprovado_em := now();
  END IF;

  IF NEW.status = 'entregue' AND NEW.entregue_em IS NULL THEN
    NEW.entregue_em := now();
  END IF;

  IF NEW.status = 'em_andamento'
     AND OLD.status IS DISTINCT FROM 'em_andamento'
     AND NOT OLD.estoque_baixado THEN
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
        RAISE EXCEPTION 'Estoque insuficiente para iniciar esta ordem de serviço.'
          USING ERRCODE = '23514';
      END IF;
    END LOOP;

    NEW.estoque_baixado := true;
  END IF;

  RETURN NEW;
END;
$function$;

-- Mudanças nos itens de uma OS já baixada ajustam somente a diferença.
-- O bloqueio da OS serializa inserções/edições com a transição para andamento.
CREATE OR REPLACE FUNCTION public.os_itens_ajustar_estoque()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_old_baixado boolean := false;
  v_new_baixado boolean := false;
  v record;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM o.id
      FROM public.ordens_servico AS o
     WHERE o.id IN (OLD.os_id, NEW.os_id)
     ORDER BY o.id
     FOR UPDATE;

    SELECT coalesce(o.estoque_baixado, false)
      INTO v_old_baixado
      FROM public.ordens_servico AS o
     WHERE o.id = OLD.os_id
     FOR UPDATE;

    SELECT coalesce(o.estoque_baixado, false)
      INTO v_new_baixado
      FROM public.ordens_servico AS o
     WHERE o.id = NEW.os_id
     FOR UPDATE;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM o.id
      FROM public.ordens_servico AS o
     WHERE o.id = NEW.os_id
     FOR UPDATE;

    SELECT coalesce(o.estoque_baixado, false)
      INTO v_new_baixado
      FROM public.ordens_servico AS o
     WHERE o.id = NEW.os_id
     FOR UPDATE;
  ELSE
    PERFORM o.id
      FROM public.ordens_servico AS o
     WHERE o.id = OLD.os_id
     FOR UPDATE;

    SELECT coalesce(o.estoque_baixado, false)
      INTO v_old_baixado
      FROM public.ordens_servico AS o
     WHERE o.id = OLD.os_id
     FOR UPDATE;
  END IF;

  FOR v IN
    SELECT movimento.peca_id,
           movimento.oficina_id,
           sum(movimento.delta)::integer AS delta
      FROM (
        SELECT OLD.peca_id,
               OLD.oficina_id,
               OLD.quantidade::bigint AS delta
         WHERE TG_OP IN ('UPDATE', 'DELETE')
           AND v_old_baixado
           AND OLD.peca_id IS NOT NULL
        UNION ALL
        SELECT NEW.peca_id,
               NEW.oficina_id,
               -NEW.quantidade::bigint AS delta
         WHERE TG_OP IN ('UPDATE', 'INSERT')
           AND v_new_baixado
           AND NEW.peca_id IS NOT NULL
      ) AS movimento
     GROUP BY movimento.peca_id, movimento.oficina_id
    HAVING sum(movimento.delta) <> 0
     ORDER BY movimento.oficina_id, movimento.peca_id
  LOOP
    UPDATE public.pecas AS p
       SET quantidade_estoque = p.quantidade_estoque + v.delta
     WHERE p.id = v.peca_id
       AND p.oficina_id = v.oficina_id
       AND (v.delta > 0 OR p.quantidade_estoque >= -v.delta);

    IF NOT FOUND THEN
      -- Ao excluir uma peça, a FK antiga define os_itens.peca_id como NULL.
      -- Nesse caso a peça já está sendo removida e não há saldo a devolver.
      IF v.delta > 0 AND NOT EXISTS (
        SELECT 1 FROM public.pecas AS p
         WHERE p.id = v.peca_id
           AND p.oficina_id = v.oficina_id
      ) THEN
        CONTINUE;
      END IF;

      RAISE EXCEPTION 'Estoque insuficiente ou peça inválida para esta alteração.'
        USING ERRCODE = '23514';
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS os_itens_ajustar_estoque_trg ON public.os_itens;
CREATE TRIGGER os_itens_ajustar_estoque_trg
AFTER INSERT OR UPDATE OR DELETE ON public.os_itens
FOR EACH ROW
EXECUTE FUNCTION public.os_itens_ajustar_estoque();

-- Recalcula os dois totais se um item for movido entre OS.
-- SECURITY DEFINER permite manter valor_total sem dar UPDATE amplo ao cliente.
CREATE OR REPLACE FUNCTION public.os_recalcular_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_os_antiga uuid;
  v_os_nova uuid;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_os_antiga := OLD.os_id;
  END IF;

  IF TG_OP IN ('UPDATE', 'INSERT') THEN
    v_os_nova := NEW.os_id;
  END IF;

  IF v_os_antiga IS NOT NULL AND v_os_antiga IS DISTINCT FROM v_os_nova THEN
    UPDATE public.ordens_servico
       SET valor_total = coalesce((
         SELECT sum(i.quantidade * i.valor_unitario)
           FROM public.os_itens AS i
          WHERE i.os_id = v_os_antiga
       ), 0)
     WHERE id = v_os_antiga;
  END IF;

  IF v_os_nova IS NOT NULL THEN
    UPDATE public.ordens_servico
       SET valor_total = coalesce((
         SELECT sum(i.quantidade * i.valor_unitario)
           FROM public.os_itens AS i
          WHERE i.os_id = v_os_nova
       ), 0)
     WHERE id = v_os_nova;
  END IF;

  RETURN NULL;
END;
$function$;

-- Funções de trigger não são endpoints RPC.
REVOKE ALL ON FUNCTION public.os_antes_atualizar() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.os_itens_ajustar_estoque() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.os_recalcular_total() FROM PUBLIC, anon, authenticated;

-- A API só pode inserir os campos do formulário e alterar o status.
-- numero, token, valor_total, timestamps e estoque_baixado são internos.
REVOKE INSERT, UPDATE ON TABLE public.ordens_servico FROM PUBLIC, anon, authenticated;
GRANT INSERT (cliente_id, moto_id, defeito_relatado, km_entrada)
  ON TABLE public.ordens_servico TO authenticated;
GRANT UPDATE (status)
  ON TABLE public.ordens_servico TO authenticated;
;
