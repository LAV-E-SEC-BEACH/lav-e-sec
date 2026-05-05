-- Corrige comparação de data nos triggers de caixa.
-- A app salva date como 'DD/MM/YYYY' (formato BR), mas o trigger comparava com 'YYYY-MM-DD'.

CREATE OR REPLACE FUNCTION public.enforce_open_cash_for_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_atendente boolean;
  _today_iso text;
  _today_br text;
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

  _today_iso := to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD');
  _today_br  := to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'DD/MM/YYYY');

  SELECT EXISTS (
    SELECT 1 FROM public.cash_register
    WHERE user_id = NEW.user_id
      AND status = 'open'
      AND date IN (_today_iso, _today_br)
  ) INTO _has_open;

  IF NOT _has_open THEN
    RAISE EXCEPTION 'CAIXA_NAO_ABERTO: Você precisa abrir o caixa do dia antes de criar uma ordem de serviço.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_close_previous_cash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_atendente boolean;
  _today_date date;
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

  _today_date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  -- Converte cada cash_register.date (texto) para date, aceitando 'YYYY-MM-DD' ou 'DD/MM/YYYY'
  SELECT COUNT(*) FROM public.cash_register
  WHERE user_id = NEW.user_id
    AND status = 'open'
    AND (
      CASE
        WHEN date ~ '^\d{4}-\d{2}-\d{2}$' THEN to_date(date, 'YYYY-MM-DD')
        WHEN date ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(date, 'DD/MM/YYYY')
        ELSE NULL
      END
    ) < _today_date
  INTO _pending_count;

  IF _pending_count > 0 THEN
    RAISE EXCEPTION 'CAIXA_ANTERIOR_ABERTO: Existe um caixa de dia anterior ainda em aberto. Encerre-o antes de abrir um novo caixa.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$function$;