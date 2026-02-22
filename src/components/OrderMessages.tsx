import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order, generateEntryMessage, generatePickupMessage, generateWhatsAppLink } from "@/lib/laundry";
import { MessageCircle } from "lucide-react";

interface Props {
  order: Order;
}

export function OrderMessages({ order }: Props) {
  const entryMsg = generateEntryMessage(order.name, order.baskets, order.total);
  const pickupMsg = generatePickupMessage(order.name);

  const openWhatsApp = (phone: string, message: string) => {
    window.open(generateWhatsAppLink(phone, message), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      {/* Mensagem de Entrada */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <MessageCircle className="h-4 w-4" />
            Mensagem de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-line select-all cursor-text">
            {entryMsg}
          </div>
          <div className="mt-2 flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => openWhatsApp(order.phone, entryMsg)}>
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem de Retirada */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-accent">
            <MessageCircle className="h-4 w-4" />
            Mensagem de Retirada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-line select-all cursor-text">
            {pickupMsg}
          </div>
          <div className="mt-2 flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => openWhatsApp(order.phone, pickupMsg)}>
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
