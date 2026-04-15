import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Client } from "./NewClientDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (client: Client) => void;
}

async function fetchAddressByCep(cep: string) {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) throw new Error("CEP inválido");
  const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return data;
}

function parseAddress(address: string) {
  const parts = address.split(",").map((s) => s.trim());
  const street = parts[0] || "";
  const numberMatch = parts[1]?.match(/Nº\s*(.+)/);
  const number = numberMatch ? numberMatch[1] : parts[1] || "";
  const neighborhood = parts[2] || "";
  const city = parts[3] || "";
  return { street, number: numberMatch ? number : "", neighborhood, city };
}

export function EditClientDialog({ open, onClose, client, onSave }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setPhone(client.phone);
      setCep("");
      const parsed = parseAddress(client.address || "");
      setStreet(parsed.street);
      setNumber(parsed.number);
      setNeighborhood(parsed.neighborhood);
      setCity(parsed.city);
    }
  }, [client]);

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
    if (!canSubmit || !client) return;
    onSave({ ...client, name: name.trim(), phone: phone.trim(), address: buildAddress() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Cliente
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone *</Label>
            <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cep">CEP</Label>
            <div className="relative">
              <Input id="edit-cep" value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="Ex: 01001000" maxLength={9} />
              {loadingCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-street">Rua</Label>
              <Input id="edit-street" value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-number">Número</Label>
              <Input id="edit-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="edit-neighborhood">Bairro</Label>
              <Input id="edit-neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">Cidade/UF</Label>
              <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
