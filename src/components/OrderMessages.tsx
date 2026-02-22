import { Button } from "@/components/ui/button";
import { Order, generateEntryMessage, generatePickupMessage, generateWhatsAppLink } from "@/lib/laundry";
import { MessageCircle } from "lucide-react";

interface Props {
  order: Order;
}

export function OrderMessages({ order }: Props) {
  const entryMsg = generateEntryMessage(order.name, order.baskets, order.total);
  const pickupMsg = generatePickupMessage(order.name);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="outline" className="gap-2 h-auto py-3 flex-col" asChild>
        <a href={generateWhatsAppLink(order.phone, entryMsg)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="text-xs">WhatsApp Entrada</span>
        </a>
      </Button>

      <Button variant="outline" className="gap-2 h-auto py-3 flex-col" asChild>
        <a href={generateWhatsAppLink(order.phone, pickupMsg)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-5 w-5 text-accent" />
          <span className="text-xs">WhatsApp Retirada</span>
        </a>
      </Button>
    </div>
  );
}
