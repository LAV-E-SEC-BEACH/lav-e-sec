import { useState, useMemo, useEffect, useCallback } from "react";
import { NewOrderForm, KnownClient } from "@/components/NewOrderForm";
import { OrdersTable } from "@/components/OrdersTable";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardPage } from "@/components/DashboardPage";
import { NewExpenseDialog } from "@/components/NewExpenseDialog";
import { EditClientDialog } from "@/components/EditClientDialog";
import { Order, calculateTotal, formatDate, formatCurrency } from "@/lib/laundry";
import { Expense } from "@/lib/expenses";
import { CATEGORY_LABELS } from "@/lib/expenses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ChevronRight, UserPlus, Pencil, Download } from "lucide-react";
import { NewClientDialog, Client } from "@/components/NewClientDialog";
import { SupportChatBot } from "@/components/SupportChatBot";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("orders");
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const canDelete = role === "admin";

  const loadData = useCallback(async () => {
    if (!user) return;
    const [ordersRes, clientsRes, expensesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
    ]);
    if (ordersRes.data) {
      setOrders(ordersRes.data.map((o: any) => ({
        id: o.id, date: o.date, name: o.name, phone: o.phone,
        baskets: o.baskets, total: Number(o.total), status: o.status as Order["status"],
      })));
    }
    if (clientsRes.data) {
      setClients(clientsRes.data.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, address: c.address || "" })));
    }
    if (expensesRes.data) {
      setExpenses(expensesRes.data.map((e: any) => ({
        id: e.id, date: e.date, description: e.description,
        category: e.category, amount: Number(e.amount),
      })));
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNewOrder = async (name: string, phone: string, baskets: number) => {
    if (!user) return;
    const total = calculateTotal(baskets);
    const date = formatDate(new Date());
    const { data, error } = await supabase.from("orders").insert({
      user_id: user.id, name, phone, baskets, total, status: "washing", date,
    }).select().single();
    if (error) { toast.error("Erro ao salvar atendimento."); return; }
    const order: Order = { id: data.id, date, name, phone, baskets, total, status: "washing" };
    setOrders((prev) => [order, ...prev]);
    setSelectedOrder(order); setDialogOpen(true); setShowForm(false);
    toast.success("Atendimento registrado com sucesso!");
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) { toast.error("Você não tem permissão para excluir."); return; }
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover."); return; }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrder?.id === id) { setSelectedOrder(null); setDialogOpen(false); }
    toast.info("Atendimento removido.");
  };

  const handleStatusChange = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao alterar status."); return; }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelectedOrder((prev) => (prev?.id === id ? { ...prev, status } : prev));
    const labels = { washing: "Em Lavagem", ready: "Pronto", picked_up: "Finalizado" };
    toast.success(`Status alterado para: ${labels[status]}`);
  };

  const handleAddClient = async (client: Client) => {
    if (!user) return;
    const { data, error } = await supabase.from("clients").insert({
      user_id: user.id, name: client.name, phone: client.phone, address: client.address,
    }).select().single();
    if (error) { toast.error("Erro ao cadastrar cliente."); return; }
    setClients((prev) => [{ id: data.id, name: data.name, phone: data.phone, address: (data as any).address || "" }, ...prev]);
    toast.success("Cliente cadastrado com sucesso!");
  };

  const handleEditClient = async (client: Client) => {
    const { error } = await supabase.from("clients").update({
      name: client.name, phone: client.phone, address: client.address,
    }).eq("id", client.id);
    if (error) { toast.error("Erro ao atualizar cliente."); return; }
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    toast.success("Cliente atualizado com sucesso!");
  };

  const handleAddExpense = async (expense: Expense) => {
    if (!user) return;
    const { data, error } = await supabase.from("expenses").insert({
      user_id: user.id, description: expense.description, category: expense.category,
      amount: expense.amount, date: expense.date,
    }).select().single();
    if (error) { toast.error("Erro ao registrar despesa."); return; }
    setExpenses((prev) => [{
      id: data.id, date: data.date, description: data.description,
      category: data.category as Expense["category"], amount: Number(data.amount),
    }, ...prev]);
    toast.success("Despesa registrada com sucesso!");
  };

  const handleDeleteExpense = async (id: string) => {
    if (!canDelete) { toast.error("Você não tem permissão para excluir."); return; }
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover despesa."); return; }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.info("Despesa removida.");
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order); setDialogOpen(true);
  };

  const knownClients = useMemo<KnownClient[]>(() => {
    const map = new Map<string, KnownClient>();
    orders.forEach((o) => map.set(o.phone, { name: o.name, phone: o.phone }));
    clients.forEach((c) => map.set(c.phone, { name: c.name, phone: c.phone }));
    return Array.from(map.values());
  }, [orders, clients]);

  const todayOrders = orders.filter((o) => o.date === formatDate(new Date()));
  const todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const breadcrumbLabels: Record<string, string> = {
    orders: "Ordens de Serviço", dashboard: "Dashboard", clients: "Clientes", expenses: "Despesas", support: "Suporte",
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-4 md:px-6" style={{ background: 'hsl(180, 30%, 18%)' }}>
          <div className="flex items-center gap-2 text-sm pl-10 md:pl-0" style={{ color: 'hsl(0, 0%, 75%)' }}>
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium" style={{ color: 'hsl(0, 0%, 95%)' }}>{breadcrumbLabels[currentPage]}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-['Space_Grotesk'] font-bold px-2 md:px-3 py-1 text-xs md:text-sm">
              {new Date().toLocaleDateString("pt-BR")} · {formatCurrency(todayTotal)}
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {currentPage === "orders" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">📋 Ordens de Serviço</h1>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2" size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Ordem</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </div>
              {showForm && (
                <div className="max-w-md">
                  <NewOrderForm onSubmit={handleNewOrder} knownClients={knownClients} />
                </div>
              )}
              <OrdersTable orders={orders} onSelect={handleSelectOrder} onDelete={canDelete ? handleDelete : undefined} />
            </div>
          )}

          {currentPage === "dashboard" && (
            <DashboardPage orders={orders} expenses={expenses} />
          )}

          {currentPage === "clients" && (
            <ClientsPage
              clients={clients}
              orders={orders}
              onAddClient={() => setShowClientDialog(true)}
              onEditClient={(c) => setEditingClient(c)}
              canDelete={canDelete}
            />
          )}

          {currentPage === "expenses" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">💰 Despesas</h1>
                <Button onClick={() => setShowExpenseDialog(true)} className="gap-2" size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Despesa</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </div>
              {expenses.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma despesa registrada ainda.</p>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {expenses.map((e) => (
                      <div key={e.id} className="rounded-lg border bg-card p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{e.description}</span>
                          <Badge variant="secondary">{CATEGORY_LABELS[e.category]}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{e.date}</span>
                          <span className="font-['Space_Grotesk'] font-medium text-destructive">{formatCurrency(e.amount)}</span>
                        </div>
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e.id)} className="text-destructive hover:text-destructive w-full">
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border bg-card overflow-hidden hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left p-4 font-medium text-muted-foreground">DATA</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">DESCRIÇÃO</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">CATEGORIA</th>
                          <th className="text-right p-4 font-medium text-muted-foreground">VALOR</th>
                          {canDelete && <th className="text-center p-4 font-medium text-muted-foreground">AÇÕES</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id} className="border-b hover:bg-muted/30">
                            <td className="p-4">{e.date}</td>
                            <td className="p-4 font-medium">{e.description}</td>
                            <td className="p-4"><Badge variant="secondary">{CATEGORY_LABELS[e.category]}</Badge></td>
                            <td className="p-4 text-right font-['Space_Grotesk'] font-medium text-destructive">{formatCurrency(e.amount)}</td>
                            {canDelete && (
                              <td className="p-4 text-center">
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e.id)} className="text-destructive hover:text-destructive">Remover</Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {currentPage === "support" && <SupportTicketsPage />}
        </main>
      </div>

      <NewClientDialog open={showClientDialog} onClose={() => setShowClientDialog(false)} onSubmit={handleAddClient} />
      <EditClientDialog open={!!editingClient} onClose={() => setEditingClient(null)} client={editingClient} onSave={handleEditClient} />
      <NewExpenseDialog open={showExpenseDialog} onClose={() => setShowExpenseDialog(false)} onSubmit={handleAddExpense} />
      <OrderDetailDialog order={selectedOrder} open={dialogOpen} onClose={() => setDialogOpen(false)} onStatusChange={handleStatusChange} />
      <SupportChatBot />
    </div>
  );
};

// --- Clients Page ---
interface ClientsPageProps {
  clients: Client[];
  orders: Order[];
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  canDelete: boolean;
}

function ClientsPage({ clients, orders, onAddClient, onEditClient, canDelete }: ClientsPageProps) {
  const allClientsData = useMemo(() => {
    const map: Record<string, { name: string; phone: string; address: string; totalOrders: number; totalSpent: number; orderDates: { date: string; total: number; baskets: number }[] }> = {};
    orders.forEach((o) => {
      if (!map[o.phone]) map[o.phone] = { name: o.name, phone: o.phone, address: "", totalOrders: 0, totalSpent: 0, orderDates: [] };
      map[o.phone].totalOrders++;
      map[o.phone].totalSpent += o.total;
      map[o.phone].orderDates.push({ date: o.date, total: o.total, baskets: o.baskets });
    });
    clients.forEach((c) => {
      if (!map[c.phone]) map[c.phone] = { name: c.name, phone: c.phone, address: c.address || "", totalOrders: 0, totalSpent: 0, orderDates: [] };
      else {
        map[c.phone].address = c.address || "";
        map[c.phone].name = c.name;
      }
    });
    return Object.values(map);
  }, [clients, orders]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredClients = useMemo(() => {
    if (!dateFrom && !dateTo) return allClientsData;
    return allClientsData.map((c) => {
      const filtered = c.orderDates.filter((od) => {
        if (dateFrom && od.date < dateFrom) return false;
        if (dateTo && od.date > dateTo) return false;
        return true;
      });
      return { ...c, orderDates: filtered, totalOrders: filtered.length, totalSpent: filtered.reduce((s, od) => s + od.total, 0) };
    }).filter((c) => c.totalOrders > 0 || (!dateFrom && !dateTo));
  }, [allClientsData, dateFrom, dateTo]);

  const handleExport = () => {
    const rows = [["Cliente", "Telefone", "Endereço", "Data do Serviço", "Cestos", "Valor do Serviço", "Total Gasto"]];
    filteredClients.forEach((c) => {
      if (c.orderDates.length === 0) {
        rows.push([c.name, c.phone, c.address, "-", "-", "-", formatCurrency(c.totalSpent)]);
      } else {
        c.orderDates.forEach((od, i) => {
          rows.push([
            i === 0 ? c.name : "",
            i === 0 ? c.phone : "",
            i === 0 ? c.address : "",
            od.date,
            String(od.baskets),
            formatCurrency(od.total),
            i === 0 ? formatCurrency(c.totalSpent) : "",
          ]);
        });
      }
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${dateFrom || "inicio"}_${dateTo || "fim"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso!");
  };

  const findClient = (phone: string) => clients.find((c) => c.phone === phone);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">👥 Clientes</h1>
        <div className="flex gap-2">
          <Button onClick={onAddClient} className="gap-2" size="sm">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Cliente</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Date filter and export */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Data Início</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background" />
        </div>
        {canDelete && (
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Planilha
          </Button>
        )}
      </div>

      {filteredClients.length === 0 && orders.length === 0 && clients.length === 0 ? (
        <p className="text-muted-foreground">Nenhum cliente registrado ainda.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredClients.map((c) => (
              <div key={c.phone} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.phone}</p>
                    {c.address && <p className="text-xs text-muted-foreground">{c.address}</p>}
                  </div>
                  {findClient(c.phone) && (
                    <Button variant="ghost" size="icon" onClick={() => onEditClient(findClient(c.phone)!)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span>{c.totalOrders} ordem(s)</span>
                  <span className="font-['Space_Grotesk'] font-medium">{formatCurrency(c.totalSpent)}</span>
                </div>
                {c.orderDates.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Histórico:</p>
                    {c.orderDates.map((od, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{od.date} · {od.baskets} cesto(s)</span>
                        <span className="font-['Space_Grotesk']">{formatCurrency(od.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="rounded-lg border bg-card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-4 font-medium text-muted-foreground">CLIENTE</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">TELEFONE</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">ENDEREÇO</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">ORDENS</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">TOTAL GASTO</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.phone} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4 text-muted-foreground">{c.phone}</td>
                    <td className="p-4 text-muted-foreground">{c.address || "-"}</td>
                    <td className="p-4 text-center">{c.totalOrders}</td>
                    <td className="p-4 text-right font-['Space_Grotesk'] font-medium">{formatCurrency(c.totalSpent)}</td>
                    <td className="p-4 text-center">
                      {findClient(c.phone) && (
                        <Button variant="ghost" size="sm" onClick={() => onEditClient(findClient(c.phone)!)}>
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// --- Support Tickets Page ---
function SupportTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("support_tickets").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setTickets(data); });
  }, [user]);

  const statusColor = (s: string) =>
    s === "aberto" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800";

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight">🎧 Chamados de Suporte</h1>
      {tickets.length === 0 ? (
        <p className="text-muted-foreground">Nenhum chamado registrado. Use o botão de chat no canto inferior direito para abrir um chamado.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.summary}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-4 font-medium text-muted-foreground">DATA</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">RESUMO</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">DESCRIÇÃO</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 whitespace-nowrap">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-4 font-medium">{t.summary}</td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">{t.description}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(t.status)}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Index;
