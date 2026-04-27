
-- Tabela para controle de caixa (abertura e fechamento)
CREATE TABLE public.cash_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date TEXT NOT NULL, -- DD/MM/YYYY do dia operacional
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cash register"
ON public.cash_register FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "Users can create cash register"
ON public.cash_register FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "Users can update cash register"
ON public.cash_register FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "Users can delete cash register"
ON public.cash_register FOR DELETE
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cash_register_updated_at
BEFORE UPDATE ON public.cash_register
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cash_register_user_date ON public.cash_register(user_id, date);
CREATE INDEX idx_cash_register_status ON public.cash_register(status);
