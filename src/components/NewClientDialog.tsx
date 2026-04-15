import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (client: Client) => void;
}

async function fetchAddressByCep(cep: string) {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) throw new Error("CEP inválido");
  const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
}

export function NewClientDialog({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  const handleCepSearch = async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      toast.error("Digite um CEP válido com 8 dígitos");
      return;
    }
    setLoadingCep(true);
    try {
      const addr = await fetchAddressByCep(cep);
      setAddress(addr);
      toast.success("Endereço encontrado!");
    } catch {
      toast.error("CEP não encontrado. Preencha manualmente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    setName("");
    setPhone("");
    setCep("");
    setAddress("");
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
            <div className="flex gap-2">
              <Input
                id="client-cep"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="Ex: 01001000"
                maxLength={9}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleCepSearch} disabled={loadingCep}>
                {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-address">Endereço</Label>
            <Input id="client-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: Rua das Flores, 123" />
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
