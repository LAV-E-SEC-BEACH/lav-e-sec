import { useState, useMemo } from "react";
import { NewOrderForm, KnownClient } from "@/components/NewOrderForm";
import { OrderMessages } from "@/components/OrderMessages";
import { OrdersTable } from "@/components/OrdersTable";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";
import { AppSidebar } from "@/components/AppSidebar";
import { Order, calculateTotal, formatDate, formatCurrency } from "@/lib/laundry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Moon, Sun, ChevronRight, UserPlus } from "lucide-react";
import { NewClientDialog, Client } from "@/components/NewClientDialog";

const Index = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("orders");
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);

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

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  // Build unique known clients from orders + registered clients
  const knownClients = useMemo<KnownClient[]>(() => {
    const map = new Map<string, KnownClient>();
    orders.forEach((o) => map.set(o.phone, { name: o.name, phone: o.phone }));
    clients.forEach((c) => map.set(c.phone, { name: c.name, phone: c.phone }));
    return Array.from(map.values());
  }, [orders, clients]);

  const todayOrders = orders.filter((o) => o.date === formatDate(new Date()));
  const todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Ordens de Serviço</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Listagem</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-['Space_Grotesk'] font-bold px-3 py-1">
              Hoje: {todayOrders.length} · {formatCurrency(todayTotal)}
            </Badge>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {currentPage === "orders" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">📋 Ordens de Serviço</h1>
                </div>
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

              <OrdersTable
                orders={orders}
                onSelect={handleSelectOrder}
                onDelete={handleDelete}
              />
            </div>
          )}

          {currentPage === "dashboard" && (
            <div className="space-y-5">
              <h1 className="text-2xl font-bold tracking-tight">📊 Dashboard</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-5">
                  <p className="text-sm text-muted-foreground">Atendimentos Hoje</p>
                  <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1">{todayOrders.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-5">
                  <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
                  <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1 text-primary">{formatCurrency(todayTotal)}</p>
                </div>
                <div className="rounded-lg border bg-card p-5">
                  <p className="text-sm text-muted-foreground">Em Lavagem</p>
                  <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1 text-warning">
                    {orders.filter((o) => o.status === "washing").length}
                  </p>
                </div>
              </div>
            </div>
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
        </main>
      </div>

      <NewClientDialog
        open={showClientDialog}
        onClose={() => setShowClientDialog(false)}
        onSubmit={handleAddClient}
      />

      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

// Clients table merging registered clients + order-derived clients
function ClientsTable({ clients, orders }: { clients: Client[]; orders: Order[] }) {
  const fromOrders = orders.reduce<Record<string, { name: string; phone: string; totalOrders: number; totalSpent: number }>>((acc, o) => {
    const key = o.phone;
    if (!acc[key]) acc[key] = { name: o.name, phone: o.phone, totalOrders: 0, totalSpent: 0 };
    acc[key].totalOrders++;
    acc[key].totalSpent += o.total;
    return acc;
  }, {});

  // Merge standalone clients
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
