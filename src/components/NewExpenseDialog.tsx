import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { Expense, ExpenseCategory, CATEGORY_LABELS } from "@/lib/expenses";
import { formatDate } from "@/lib/laundry";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (expense: Expense) => void;
}

export function NewExpenseDialog({ open, onClose, onSubmit }: Props) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [amount, setAmount] = useState("");

  const canSubmit = description.trim().length > 0 && category !== "" && parseFloat(amount) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      id: crypto.randomUUID(),
      date: formatDate(new Date()),
      description: description.trim(),
      category: category as ExpenseCategory,
      amount: parseFloat(amount),
    });
    setDescription("");
    setCategory("");
    setAmount("");
    onClose();
    toast.success("Despesa registrada com sucesso!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-destructive" />
            Nova Despesa
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-desc">Descrição *</Label>
            <Input
              id="expense-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Conta de luz do mês"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Valor (R$) *</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>Registrar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
