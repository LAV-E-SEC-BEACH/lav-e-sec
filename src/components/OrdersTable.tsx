import { useState } from "react";
import { Order, formatCurrency } from "@/lib/laundry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  orders: Order[];
  onSelect: (order: Order) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<Order["status"], { label: string; className: string }> = {
  washing: { label: "Em Lavagem", className: "bg-warning/15 text-warning border border-warning/30" },
  ready: { label: "Pronto", className: "bg-success/15 text-success border border-success/30" },
  picked_up: { label: "Finalizado", className: "bg-muted text-muted-foreground border border-border" },
};

const paymentStatus = (order: Order) => {
  if (order.status === "picked_up") return { label: "Pago", className: "bg-success/15 text-success border border-success/30" };
  return { label: "Em Aberto", className: "bg-warning/15 text-warning border border-warning/30" };
};

const ITEMS_PER_PAGE = 10;

export function OrdersTable({ orders, onSelect, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = orders.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">Nenhuma ordem de serviço registrada.</p>
        <p className="text-sm mt-1">Registre um novo atendimento para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} registro(s)</span>
          <span>·</span>
          <span>Mais recentes</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 w-full sm:w-64 h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtro</span>
          </Button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.map((order) => {
          const payment = paymentStatus(order);
          return (
            <div
              key={order.id}
              className="rounded-lg border bg-card p-4 space-y-3 cursor-pointer active:bg-muted/30"
              onClick={() => onSelect(order)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{order.name}</span>
                <Badge className={statusConfig[order.status].className} variant="secondary">
                  {statusConfig[order.status].label}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{order.phone}</span>
                <span className="font-['Space_Grotesk'] font-medium">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{order.date}</span>
                <div className="flex items-center gap-2">
                  <Badge className={payment.className} variant="secondary">{payment.label}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="rounded-lg border bg-card overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-16">#</TableHead>
              <TableHead>CLIENTE</TableHead>
              <TableHead>TELEFONE</TableHead>
              <TableHead className="text-center">CESTOS</TableHead>
              <TableHead className="text-right">VALOR</TableHead>
              <TableHead className="text-center">PAGAMENTO</TableHead>
              <TableHead>DATA</TableHead>
              <TableHead className="text-center">STATUS</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((order) => {
              const payment = paymentStatus(order);
              const orderNum = String(10010 + orders.indexOf(order)).padStart(5, "0");
              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onSelect(order)}
                >
                  <TableCell className="font-mono text-muted-foreground text-sm">{orderNum}</TableCell>
                  <TableCell className="font-medium">{order.name}</TableCell>
                  <TableCell className="text-muted-foreground">{order.phone}</TableCell>
                  <TableCell className="text-center">{order.baskets}</TableCell>
                  <TableCell className="text-right font-medium font-['Space_Grotesk']">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={payment.className} variant="secondary">{payment.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.date}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={statusConfig[order.status].className} variant="secondary">
                      {statusConfig[order.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground text-xs sm:text-sm">
          {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setPage(p)}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
