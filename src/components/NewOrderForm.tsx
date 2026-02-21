import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateTotal, formatCurrency, PRICE_PER_BASKET } from "@/lib/laundry";
import { Plus, Minus, ShoppingBasket } from "lucide-react";

interface Props {
  onSubmit: (name: string, phone: string, baskets: number) => void;
}

export function NewOrderForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [baskets, setBaskets] = useState(1);

  const total = calculateTotal(baskets);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit(name.trim(), phone.trim(), baskets);
    setName("");
    setPhone("");
    setBaskets(1);
  };

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <Card className="shadow-lg border-0 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShoppingBasket className="h-5 w-5 text-primary" />
          Novo Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11999998888"
              maxLength={20}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Quantidade de Cestos</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setBaskets(Math.max(1, baskets - 1))}
                disabled={baskets <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold w-12 text-center font-['Space_Grotesk']">
                {baskets}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setBaskets(baskets + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(PRICE_PER_BASKET)} por cesto
            </p>
          </div>

          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold text-primary font-['Space_Grotesk']">
              {formatCurrency(total)}
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
            Registrar Atendimento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
