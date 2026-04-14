
-- Add address column to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address text DEFAULT '';

-- DELETE orders: only owner or admin
DROP POLICY IF EXISTS "Users can delete orders" ON public.orders;
CREATE POLICY "Users can delete orders" ON public.orders FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- DELETE expenses: only owner or admin
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
CREATE POLICY "Users can delete expenses" ON public.expenses FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Orders: atendente can view/create/update
DROP POLICY IF EXISTS "Users can view orders" ON public.orders;
CREATE POLICY "Users can view orders" ON public.orders FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Users can update orders" ON public.orders;
CREATE POLICY "Users can update orders" ON public.orders FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

-- Clients: atendente can view/create/update but not delete
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
CREATE POLICY "Users can view clients" ON public.clients FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
CREATE POLICY "Users can create clients" ON public.clients FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
CREATE POLICY "Users can update clients" ON public.clients FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;
CREATE POLICY "Users can delete clients" ON public.clients FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Expenses: atendente can view/create/update but not delete
DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
CREATE POLICY "Users can view expenses" ON public.expenses FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
CREATE POLICY "Users can create expenses" ON public.expenses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
CREATE POLICY "Users can update expenses" ON public.expenses FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

-- Update handle_new_user to support 'atendente' role (default for new users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _display_name text;
  _phone text;
BEGIN
  _display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  IF NEW.email IN ('thiago.sms.adrisam@gmail.com', 'matheuslimalessa22@gmail.com') THEN
    _role := 'admin';
    IF NEW.email = 'thiago.sms.adrisam@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Thiago Mendes');
      _phone := COALESCE(NULLIF(_phone, ''), '85987913777');
    ELSIF NEW.email = 'matheuslimalessa22@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Matheus Lessa');
      _phone := COALESCE(NULLIF(_phone, ''), '11993391733');
    END IF;
  ELSIF NEW.raw_user_meta_data->>'role' = 'support' THEN
    _role := 'support';
  ELSIF NEW.raw_user_meta_data->>'role' = 'atendente' THEN
    _role := 'atendente';
  ELSE
    _role := 'atendente';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (NEW.id, _display_name, _phone);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$function$;
