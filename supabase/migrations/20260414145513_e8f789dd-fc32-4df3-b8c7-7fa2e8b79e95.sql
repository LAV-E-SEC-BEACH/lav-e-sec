
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
  _display_name text;
  _phone text;
BEGIN
  _display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  -- Admin emails get admin role automatically
  IF NEW.email IN ('thiago.mesquita@gmail.com', 'adriano.brito@gmail.com', 'administrador@gmail.com') THEN
    _role := 'admin';
    -- Set display name and phone for known admins
    IF NEW.email = 'thiago.mesquita@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Thiago Mendes de Mesquita');
      _phone := COALESCE(NULLIF(_phone, ''), '85987913777');
    ELSIF NEW.email = 'adriano.brito@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Adriano Brito');
      _phone := COALESCE(NULLIF(_phone, ''), '85988818890');
    ELSIF NEW.email = 'administrador@gmail.com' THEN
      _display_name := COALESCE(NULLIF(_display_name, ''), 'Administrador');
      _phone := COALESCE(NULLIF(_phone, ''), '11993391733');
    END IF;
  ELSIF NEW.raw_user_meta_data->>'role' = 'support' THEN
    _role := 'support';
  ELSE
    _role := 'admin';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (NEW.id, _display_name, _phone);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;
