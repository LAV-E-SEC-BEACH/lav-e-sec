import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, generateEntryMessage, generatePickupMessage, generateWhatsAppLink, generateSpreadsheetRow } from "@/lib/laundry";
import { Copy, MessageCircle, ClipboardList, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  order: Order;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado!" : "Copiar"}
    </Button>
  );
}

export function OrderMessages({ order }: Props) {
  const entryMsg = generateEntryMessage(order.name, order.baskets, order.total);
  const pickupMsg = generatePickupMessage(order.name);
  const spreadsheetRow = generateSpreadsheetRow(order);

  return (
    <div className="space-y-4">
      {/* Spreadsheet Row */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Registro para Planilha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
            {spreadsheetRow}
          </div>
          <div className="mt-2 flex justify-end">
            <CopyButton text={spreadsheetRow} label="Registro" />
          </div>
        </CardContent>
      </Card>

      {/* Entry Message */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <MessageCircle className="h-4 w-4" />
            Mensagem de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-line">
            {entryMsg}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <CopyButton text={entryMsg} label="Mensagem de entrada" />
            <Button size="sm" asChild className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
              <a href={generateWhatsAppLink(order.phone, entryMsg)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Message */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-accent">
            <MessageCircle className="h-4 w-4" />
            Mensagem de Retirada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-line">
            {pickupMsg}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <CopyButton text={pickupMsg} label="Mensagem de retirada" />
            <Button size="sm" asChild className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
              <a href={generateWhatsAppLink(order.phone, pickupMsg)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
