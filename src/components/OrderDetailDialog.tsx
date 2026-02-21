import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order, formatCurrency } from "@/lib/laundry";
import { OrderMessages } from "@/components/OrderMessages";

interface Props {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: Order["status"]) => void;
}

const statusConfig: Record<Order["status"], { label: string; className: string }> = {
  washing: { label: "Em Lavagem", className: "bg-warning text-warning-foreground" },
  ready: { label: "Pronto", className: "bg-success text-success-foreground" },
  picked_up: { label: "Finalizado", className: "bg-muted text-muted-foreground" },
};

export function OrderDetailDialog({ order, open, onClose, onStatusChange }: Props) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{order.name}</span>
            <Badge className={statusConfig[order.status].className} variant="secondary">
              {statusConfig[order.status].label}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{order.phone} · {order.date}</p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Order Info */}
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Cestos</p>
              <p className="text-lg font-bold font-['Space_Grotesk']">{order.baskets}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="text-lg font-bold font-['Space_Grotesk']">{formatCurrency(order.total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="text-lg font-bold font-['Space_Grotesk']">{order.date}</p>
            </div>
          </div>

          {/* Status Change */}
          <div>
            <p className="text-sm font-medium mb-2">Alterar Status</p>
            <div className="flex gap-2">
              {(["washing", "ready", "picked_up"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={order.status === s ? "default" : "outline"}
                  onClick={() => onStatusChange(order.id, s)}
                  className="flex-1"
                >
                  {statusConfig[s].label}
                </Button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <OrderMessages order={order} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
