import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Headset, LogOut, RefreshCw } from "lucide-react";

interface Ticket {
  id: string;
  name: string;
  phone: string;
  summary: string;
  description: string;
  status: string;
  created_at: string;
}

const SupportDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTickets(data as Ticket[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user && role === "support") fetchTickets();
  }, [user, role]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "aberto" ? "resolvido" : "aberto";
    const { error } = await supabase.from("support_tickets").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status."); return; }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    toast.success(`Chamado marcado como ${newStatus}.`);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/suporte-cadastro" replace />;
  if (role !== "support") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium">Acesso restrito ao time de suporte.</p>
          <Button variant="outline" onClick={signOut}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Headset className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">Suporte LAV & SEC BEACH</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchTickets}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
        <h1 className="text-xl md:text-2xl font-bold">🎧 Chamados de Suporte</h1>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : tickets.length === 0 ? (
          <p className="text-muted-foreground">Nenhum chamado registrado.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{t.name}</span>
                    <Badge variant={t.status === "aberto" ? "destructive" : "secondary"}>{t.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.phone}</p>
                  <p className="text-sm font-medium">{t.summary}</p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</span>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(t.id, t.status)}>
                      {t.status === "aberto" ? "Resolver" : "Reabrir"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="rounded-lg border bg-card overflow-hidden hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-4 font-medium text-muted-foreground">DATA</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">NOME</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">TELEFONE</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">RESUMO</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">DESCRIÇÃO</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">STATUS</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-muted/30">
                      <td className="p-4 whitespace-nowrap">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                      <td className="p-4 font-medium">{t.name}</td>
                      <td className="p-4 text-muted-foreground">{t.phone}</td>
                      <td className="p-4">{t.summary}</td>
                      <td className="p-4 text-muted-foreground max-w-xs truncate">{t.description}</td>
                      <td className="p-4 text-center">
                        <Badge variant={t.status === "aberto" ? "destructive" : "secondary"}>{t.status}</Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(t.id, t.status)}>
                          {t.status === "aberto" ? "Resolver" : "Reabrir"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SupportDashboard;
