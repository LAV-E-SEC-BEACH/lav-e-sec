import { Order, formatCurrency } from "@/lib/laundry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";

interface Props {
  orders: Order[];
  onSelect: (order: Order) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<Order["status"], string> = {
  washing: "Lavando",
  ready: "Pronto",
  picked_up: "Retirado",
};

const statusColors: Record<Order["status"], string> = {
  washing: "bg-warning text-warning-foreground",
  ready: "bg-success text-success-foreground",
  picked_up: "bg-muted text-muted-foreground",
};

export function OrdersTable({ orders, onSelect, onDelete }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Nenhum atendimento registrado ainda.</p>
        <p className="text-sm mt-1">Registre um novo atendimento ao lado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-center">Cestos</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onSelect(order)}>
              <TableCell className="font-mono text-sm">{order.date}</TableCell>
              <TableCell className="font-medium">{order.name}</TableCell>
              <TableCell className="text-center">{order.baskets}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
              <TableCell className="text-center">
                <Badge className={statusColors[order.status]} variant="secondary">
                  {statusLabels[order.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelect(order); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
