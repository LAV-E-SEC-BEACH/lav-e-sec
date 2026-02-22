import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, generateEntryMessage, generatePickupMessage, generateWhatsAppLink, generateSpreadsheetRow } from "@/lib/laundry";
import { MessageCircle, ClipboardList, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  order: Order;
}

export function OrderMessages({ order }: Props) {
  const [copiedSheet, setCopiedSheet] = useState(false);
  const entryMsg = generateEntryMessage(order.name, order.baskets, order.total);
  const pickupMsg = generatePickupMessage(order.name);
  const spreadsheetRow = generateSpreadsheetRow(order);

  const handleCopySheet = async () => {
    await navigator.clipboard.writeText(spreadsheetRow);
    setCopiedSheet(true);
    toast.success("Registro copiado para a planilha!");
    setTimeout(() => setCopiedSheet(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="gap-2 h-auto py-3 flex-col"
          onClick={handleCopySheet}
        >
          {copiedSheet ? <Check className="h-5 w-5 text-green-500" /> : <ClipboardList className="h-5 w-5" />}
          <span className="text-xs">{copiedSheet ? "Copiado!" : "Planilha"}</span>
        </Button>

        <Button
          variant="outline"
          className="gap-2 h-auto py-3 flex-col"
          asChild
        >
          <a href={generateWhatsAppLink(order.phone, entryMsg)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="text-xs">Entrada</span>
          </a>
        </Button>

        <Button
          variant="outline"
          className="gap-2 h-auto py-3 flex-col"
          asChild
        >
          <a href={generateWhatsAppLink(order.phone, pickupMsg)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5 text-accent" />
            <span className="text-xs">Retirada</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
