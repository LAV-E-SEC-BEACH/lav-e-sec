import { useState } from "react";
import { NewOrderForm } from "@/components/NewOrderForm";
import { OrderMessages } from "@/components/OrderMessages";
import { OrdersTable } from "@/components/OrdersTable";
import { Order, calculateTotal, formatDate } from "@/lib/laundry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { WashingMachine, X } from "lucide-react";

const Index = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    toast.success("Atendimento registrado com sucesso!");
  };

  const handleDelete = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrder?.id === id) setSelectedOrder(null);
    toast.info("Atendimento removido.");
  };

  const handleStatusChange = (id: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => prev ? { ...prev, status } : null);
    }
  };

  const todayOrders = orders.filter((o) => o.date === formatDate(new Date()));
  const todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <WashingMachine className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lavanderia</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Hoje</p>
              <p className="font-bold text-lg font-['Space_Grotesk']">{todayOrders.length} atendimentos</p>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1 font-['Space_Grotesk'] font-bold">
              R$ {todayTotal.toFixed(2).replace(".", ",")}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-1">
            <NewOrderForm onSubmit={handleNewOrder} />
          </div>

          {/* Right: Messages or Table */}
          <div className="lg:col-span-2 space-y-6">
            {selectedOrder ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedOrder.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {(["washing", "ready", "picked_up"] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={selectedOrder.status === s ? "default" : "outline"}
                          onClick={() => handleStatusChange(selectedOrder.id, s)}
                        >
                          {s === "washing" ? "Lavando" : s === "ready" ? "Pronto" : "Retirado"}
                        </Button>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <OrderMessages order={selectedOrder} />
              </div>
            ) : null}

            <div>
              <h2 className="text-lg font-bold mb-3">Atendimentos do Dia</h2>
              <OrdersTable orders={todayOrders} onSelect={setSelectedOrder} onDelete={handleDelete} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
