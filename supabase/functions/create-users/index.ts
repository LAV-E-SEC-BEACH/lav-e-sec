import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "adriano.brito@gmail.com", password: "Admin@2026", name: "Adriano Brito", phone: "85988818890" },
    { email: "suporte24@gmail.com", password: "suporte@2026", name: "Suporte 24 horas", phone: "11993391733" },
  ];

  const results = [];
  for (const u of users) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { display_name: u.name, phone: u.phone },
    });
    results.push({ email: u.email, ok: !error, error: error?.message, id: data?.user?.id });
  }

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
});
