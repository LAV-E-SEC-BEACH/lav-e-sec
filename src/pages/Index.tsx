import { useState, useMemo } from "react";
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

const Index = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("orders");
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  const handleNewOrder = (name: string, phone: string, baskets: number) => {
    const order: Order = {
      id: crypto.randomUUID(),
      date: formatDate(new Date()),
      name,
      phone,
      baskets,
      total: calculateTotal(baskets),
      status: "washing",
    };
    setOrders((prev) => [order, ...prev]);
    setSelectedOrder(order);
    setDialogOpen(true);
    setShowForm(false);
    toast.success("Atendimento registrado com sucesso!");
  };

  const handleDelete = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrder?.id === id) {
      setSelectedOrder(null);
      setDialogOpen(false);
    }
    toast.info("Atendimento removido.");
  };

  const handleStatusChange = (id: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    setSelectedOrder((prev) => (prev?.id === id ? { ...prev, status } : prev));
    const labels = { washing: "Em Lavagem", ready: "Pronto", picked_up: "Finalizado" };
    toast.success(`Status alterado para: ${labels[status]}`);
  };

  const handleAddClient = (client: Client) => {
    setClients((prev) => [client, ...prev]);
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.info("Despesa removida.");
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
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
    orders: "Ordens de Serviço",
    dashboard: "Dashboard",
    clients: "Clientes",
    expenses: "Despesas",
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{breadcrumbLabels[currentPage]}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-['Space_Grotesk'] font-bold px-3 py-1">
              Hoje: {todayOrders.length} · {formatCurrency(todayTotal)}
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-6">
          {currentPage === "orders" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">📋 Ordens de Serviço</h1>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Ordem
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
            <DashboardPage
              orders={orders}
              expenses={expenses}
              onAddExpense={() => setShowExpenseDialog(true)}
            />
          )}

          {currentPage === "clients" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">👥 Clientes</h1>
                <Button onClick={() => setShowClientDialog(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Novo Cliente
                </Button>
              </div>
              {clients.length === 0 && orders.length === 0 ? (
                <p className="text-muted-foreground">Nenhum cliente registrado ainda.</p>
              ) : (
                <div className="rounded-lg border bg-card overflow-hidden">
                  <ClientsTable clients={clients} orders={orders} />
                </div>
              )}
            </div>
          )}

          {currentPage === "expenses" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">💰 Despesas</h1>
                <Button onClick={() => setShowExpenseDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Despesa
                </Button>
              </div>
              {expenses.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma despesa registrada ainda.</p>
              ) : (
                <div className="rounded-lg border bg-card overflow-hidden">
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
                          <td className="p-4">
                            <Badge variant="secondary">{CATEGORY_LABELS[e.category]}</Badge>
                          </td>
                          <td className="p-4 text-right font-['Space_Grotesk'] font-medium text-destructive">
                            {formatCurrency(e.amount)}
                          </td>
                          <td className="p-4 text-center">
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e.id)} className="text-destructive hover:text-destructive">
                              Remover
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <NewClientDialog open={showClientDialog} onClose={() => setShowClientDialog(false)} onSubmit={handleAddClient} />
      <NewExpenseDialog open={showExpenseDialog} onClose={() => setShowExpenseDialog(false)} onSubmit={handleAddExpense} />
      <OrderDetailDialog order={selectedOrder} open={dialogOpen} onClose={() => setDialogOpen(false)} onStatusChange={handleStatusChange} />
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
    if (!fromOrders[c.phone]) {
      fromOrders[c.phone] = { name: c.name, phone: c.phone, totalOrders: 0, totalSpent: 0 };
    }
  });

  const allClients = Object.values(fromOrders);

  return (
    <table className="w-full text-sm">
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
  );
}

export default Index;
