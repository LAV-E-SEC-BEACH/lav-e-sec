
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
  _display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', '');
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  IF NEW.email IN ('thiago.sms.adrisam@gmail.com', 'matheuslimalessa22@gmail.com', 'adriano.brito@gmail.com') THEN
    _role := 'admin';
    IF NEW.email = 'thiago.sms.adrisam@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Thiago Mendes');
      _phone := COALESCE(NULLIF(_phone, ''), '85987913777');
    ELSIF NEW.email = 'matheuslimalessa22@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Matheus Lessa');
      _phone := COALESCE(NULLIF(_phone, ''), '11993391733');
    ELSIF NEW.email = 'adriano.brito@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Adriano Brito');
      _phone := COALESCE(NULLIF(_phone, ''), '85988818890');
    END IF;
  ELSIF NEW.email = 'suporte24@gmail.com' THEN
    _role := 'support';
    _display_name := COALESCE(NULLIF(_display_name, ''), 'Suporte 24 horas');
    _phone := COALESCE(NULLIF(_phone, ''), '11993391733');
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
