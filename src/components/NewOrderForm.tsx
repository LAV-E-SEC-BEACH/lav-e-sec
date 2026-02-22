import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calculateTotal, formatCurrency, PRICE_PER_BASKET } from "@/lib/laundry";
import { Plus, Minus, ShoppingBasket } from "lucide-react";

export interface KnownClient {
  name: string;
  phone: string;
}

interface Props {
  onSubmit: (name: string, phone: string, baskets: number) => void;
  knownClients?: KnownClient[];
}

export function NewOrderForm({ onSubmit, knownClients = [] }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [baskets, setBaskets] = useState(1);
  const [nameOpen, setNameOpen] = useState(false);

  const total = calculateTotal(baskets);

  const filteredClients = useMemo(() => {
    if (!name.trim()) return knownClients;
    const q = name.toLowerCase();
    return knownClients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [name, knownClients]);

  const handleSelectClient = (client: KnownClient) => {
    setName(client.name);
    setPhone(client.phone);
    setNameOpen(false);
  };

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
            <Popover open={nameOpen && filteredClients.length > 0} onOpenChange={setNameOpen}>
              <PopoverTrigger asChild>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameOpen(true);
                  }}
                  onFocus={() => setNameOpen(true)}
                  placeholder="Ex: João Silva"
                  maxLength={100}
                  required
                  autoComplete="off"
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
                    <CommandGroup heading="Clientes cadastrados">
                      {filteredClients.map((c) => (
                        <CommandItem
                          key={c.phone}
                          value={`${c.name} ${c.phone}`}
                          onSelect={() => handleSelectClient(c)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-xs text-muted-foreground">{c.phone}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
