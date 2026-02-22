import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (client: Client) => void;
}

export function NewClientDialog({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
    });
    setName("");
    setPhone("");
    onClose();
    toast.success("Cliente cadastrado com sucesso!");
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
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">Telefone (WhatsApp) *</Label>
            <Input
              id="client-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11999998888"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
