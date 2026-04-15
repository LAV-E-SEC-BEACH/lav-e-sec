import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface ViaCepData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

async function fetchAddressByCep(cep: string): Promise<ViaCepData> {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) throw new Error("CEP inválido");
  const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return data;
}

export function NewClientDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (client: Client) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  const handleCepChange = async (value: string) => {
    setCep(value);
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const data = await fetchAddressByCep(cleaned);
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(`${data.localidade} - ${data.uf}`);
        toast.success("Endereço encontrado!");
      } catch {
        toast.error("CEP não encontrado.");
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const buildAddress = () => {
    const parts = [street, number ? `Nº ${number}` : "", neighborhood, city].filter(Boolean);
    return parts.join(", ");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      address: buildAddress(),
    });
    setName(""); setPhone(""); setCep(""); setStreet(""); setNumber(""); setNeighborhood(""); setCity("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Cliente
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome do Cliente *</Label>
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">Telefone (WhatsApp) *</Label>
            <Input id="client-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 11999998888" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-cep">CEP</Label>
            <div className="relative">
              <Input id="client-cep" value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="Ex: 01001000" maxLength={9} />
              {loadingCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="client-street">Rua</Label>
              <Input id="client-street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua das Flores" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-number">Número</Label>
              <Input id="client-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="client-neighborhood">Bairro</Label>
              <Input id="client-neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Centro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-city">Cidade/UF</Label>
              <Input id="client-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo - SP" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>Cadastrar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
