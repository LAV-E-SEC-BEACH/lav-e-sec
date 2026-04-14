import { useState, useMemo, useEffect, useCallback } from "react";
import { NewOrderForm, KnownClient } from "@/components/NewOrderForm";
import { OrdersTable } from "@/components/OrdersTable";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardPage } from "@/components/DashboardPage";
import { NewExpenseDialog } from "@/components/NewExpenseDialog";
import { Order, calculateTotal, formatDate, formatCurrency } from "@/lib/laundry";
import { Expense } from "@/lib/expenses";
import { CATEGORY_LABELS } from "@/lib/expenses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ChevronRight, UserPlus } from "lucide-react";
import { NewClientDialog, Client } from "@/components/NewClientDialog";
import { SupportChatBot } from "@/components/SupportChatBot";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("orders");
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

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
      setClients(clientsRes.data.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })));
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
      user_id: user.id, name: client.name, phone: client.phone,
    }).select().single();
    if (error) { toast.error("Erro ao cadastrar cliente."); return; }
    setClients((prev) => [{ id: data.id, name: data.name, phone: data.phone }, ...prev]);
    toast.success("Cliente cadastrado com sucesso!");
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
    orders: "Ordens de Serviço", dashboard: "Dashboard", clients: "Clientes", expenses: "Despesas",
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground pl-10 md:pl-0">
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{breadcrumbLabels[currentPage]}</span>
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
              <OrdersTable orders={orders} onSelect={handleSelectOrder} onDelete={handleDelete} />
            </div>
          )}

          {currentPage === "dashboard" && (
            <DashboardPage orders={orders} expenses={expenses} onAddExpense={() => setShowExpenseDialog(true)} />
          )}

          {currentPage === "clients" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">👥 Clientes</h1>
                <Button onClick={() => setShowClientDialog(true)} className="gap-2" size="sm">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo Cliente</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </div>
              {clients.length === 0 && orders.length === 0 ? (
                <p className="text-muted-foreground">Nenhum cliente registrado ainda.</p>
              ) : (
                <div className="rounded-lg border bg-card overflow-x-auto">
                  <ClientsTable clients={clients} orders={orders} />
                </div>
              )}
            </div>
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
                  {/* Mobile cards */}
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
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e.id)} className="text-destructive hover:text-destructive w-full">
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                  {/* Desktop table */}
                  <div className="rounded-lg border bg-card overflow-hidden hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left p-4 font-medium text-muted-foreground">DATA</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">DESCRIÇÃO</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">CATEGORIA</th>
                          <th className="text-right p-4 font-medium text-muted-foreground">VALOR</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id} className="border-b hover:bg-muted/30">
                            <td className="p-4">{e.date}</td>
                            <td className="p-4 font-medium">{e.description}</td>
                            <td className="p-4"><Badge variant="secondary">{CATEGORY_LABELS[e.category]}</Badge></td>
                            <td className="p-4 text-right font-['Space_Grotesk'] font-medium text-destructive">{formatCurrency(e.amount)}</td>
                            <td className="p-4 text-center">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e.id)} className="text-destructive hover:text-destructive">Remover</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <NewClientDialog open={showClientDialog} onClose={() => setShowClientDialog(false)} onSubmit={handleAddClient} />
      <NewExpenseDialog open={showExpenseDialog} onClose={() => setShowExpenseDialog(false)} onSubmit={handleAddExpense} />
      <OrderDetailDialog order={selectedOrder} open={dialogOpen} onClose={() => setDialogOpen(false)} onStatusChange={handleStatusChange} />
      <SupportChatBot />
    </div>
  );
};

function ClientsTable({ clients, orders }: { clients: Client[]; orders: Order[] }) {
  const fromOrders = orders.reduce<Record<string, { name: string; phone: string; totalOrders: number; totalSpent: number }>>((acc, o) => {
    const key = o.phone;
    if (!acc[key]) acc[key] = { name: o.name, phone: o.phone, totalOrders: 0, totalSpent: 0 };
    acc[key].totalOrders++;
    acc[key].totalSpent += o.total;
    return acc;
  }, {});
  clients.forEach((c) => {
    if (!fromOrders[c.phone]) fromOrders[c.phone] = { name: c.name, phone: c.phone, totalOrders: 0, totalSpent: 0 };
  });
  const allClients = Object.values(fromOrders);

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 p-3 md:hidden">
        {allClients.map((c) => (
          <div key={c.phone} className="rounded-lg border bg-card p-4 space-y-1">
            <p className="font-medium">{c.name}</p>
            <p className="text-sm text-muted-foreground">{c.phone}</p>
            <div className="flex items-center justify-between text-sm pt-1">
              <span>{c.totalOrders} ordem(s)</span>
              <span className="font-['Space_Grotesk'] font-medium">{formatCurrency(c.totalSpent)}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <table className="w-full text-sm hidden md:table">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left p-4 font-medium text-muted-foreground">CLIENTE</th>
            <th className="text-left p-4 font-medium text-muted-foreground">TELEFONE</th>
            <th className="text-center p-4 font-medium text-muted-foreground">ORDENS</th>
            <th className="text-right p-4 font-medium text-muted-foreground">TOTAL GASTO</th>
          </tr>
        </thead>
        <tbody>
          {allClients.map((c) => (
            <tr key={c.phone} className="border-b hover:bg-muted/30">
              <td className="p-4 font-medium">{c.name}</td>
              <td className="p-4 text-muted-foreground">{c.phone}</td>
              <td className="p-4 text-center">{c.totalOrders}</td>
              <td className="p-4 text-right font-['Space_Grotesk'] font-medium">{formatCurrency(c.totalSpent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default Index;
