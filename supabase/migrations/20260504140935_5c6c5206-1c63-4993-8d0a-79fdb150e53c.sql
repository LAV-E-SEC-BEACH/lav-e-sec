CREATE OR REPLACE FUNCTION public.cash_rules_active_at()
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT '2026-05-04 20:00:00-03'::timestamptz
$$;

CREATE OR REPLACE FUNCTION public.enforce_open_cash_for_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_atendente boolean;
  _today text;
  _has_open boolean;
BEGIN
  IF now() < public.cash_rules_active_at() THEN
    RETURN NEW;
  END IF;

  _is_atendente := public.has_role(NEW.user_id, 'atendente'::app_role)
                   AND NOT public.has_role(NEW.user_id, 'admin'::app_role);

  IF NOT _is_atendente THEN
    RETURN NEW;
  END IF;

  _today := to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD');

  SELECT EXISTS (
    SELECT 1 FROM public.cash_register
    WHERE user_id = NEW.user_id
      AND status = 'open'
      AND date = _today
  ) INTO _has_open;

  IF NOT _has_open THEN
    RAISE EXCEPTION 'CAIXA_NAO_ABERTO: Você precisa abrir o caixa do dia antes de criar uma ordem de serviço.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_open_cash_for_orders ON public.orders;
CREATE TRIGGER trg_enforce_open_cash_for_orders
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_open_cash_for_orders();

CREATE OR REPLACE FUNCTION public.enforce_close_previous_cash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_atendente boolean;
  _today text;
  _pending_count int;
BEGIN
  IF now() < public.cash_rules_active_at() THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'open' THEN
    RETURN NEW;
  END IF;

  _is_atendente := public.has_role(NEW.user_id, 'atendente'::app_role)
                   AND NOT public.has_role(NEW.user_id, 'admin'::app_role);

  IF NOT _is_atendente THEN
    RETURN NEW;
  END IF;

  _today := to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD');

  SELECT COUNT(*) FROM public.cash_register
  WHERE user_id = NEW.user_id
    AND status = 'open'
    AND date < _today
  INTO _pending_count;

  IF _pending_count > 0 THEN
    RAISE EXCEPTION 'CAIXA_ANTERIOR_ABERTO: Existe um caixa de dia anterior ainda em aberto. Encerre-o antes de abrir um novo caixa.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_close_previous_cash ON public.cash_register;
CREATE TRIGGER trg_enforce_close_previous_cash
BEFORE INSERT ON public.cash_register
FOR EACH ROW
EXECUTE FUNCTION public.enforce_close_previous_cash();