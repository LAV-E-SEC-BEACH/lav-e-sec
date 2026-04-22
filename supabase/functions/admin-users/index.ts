import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(await isAdmin(caller.id))) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST USERS
    if (req.method === "GET" && action === "list") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;

      // Get roles and profiles
      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");

      const enriched = users.map((u) => {
        const role = roles?.find((r) => r.user_id === u.id);
        const profile = profiles?.find((p) => p.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          display_name: profile?.display_name || "",
          phone: profile?.phone || "",
          role: role?.role || "atendente",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          banned: u.banned_until ? true : false,
        };
      });

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST actions
    if (req.method === "POST") {
      const body = await req.json();

      if (action === "reset-password") {
        const { userId, newPassword } = body;
        if (!userId || !newPassword || newPassword.length < 6) {
          return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "change-role") {
        const { userId, newRole } = body;
        if (!["admin", "support", "atendente"].includes(newRole)) {
          return new Response(JSON.stringify({ error: "Role inválida" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Upsert role
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabaseAdmin
            .from("user_roles")
            .update({ role: newRole })
            .eq("user_id", userId);
          if (error) throw error;
        } else {
          const { error } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: newRole });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "toggle-ban") {
        const { userId, ban } = body;
        if (ban) {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "876000h", // ~100 years
          });
          if (error) throw error;
        } else {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "none",
          });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete") {
        const { userId } = body;
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Ação não encontrada" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});