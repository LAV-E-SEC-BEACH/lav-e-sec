import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DollarSign, LockOpen, Lock, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/laundry";

interface CashRegister {
  id: string;
  date: string;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed";
  notes: string | null;
}

const PAGE_SIZE = 10;

export function CashRegisterPage() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const canDelete = role === "admin";

  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const today = formatDate(new Date());
  const currentOpen = registers.find((r) => r.status === "open");
  const lastClosed = registers.find((r) => r.status === "closed");

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cash_register")
      .select("*")
      .order("opened_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar caixas.");
    } else if (data) {
      setRegisters(
        data.map((r: any) => ({
          id: r.id,
          date: r.date,
          opening_amount: Number(r.opening_amount),
          closing_amount: r.closing_amount !== null ? Number(r.closing_amount) : null,
          opened_at: r.opened_at,
          closed_at: r.closed_at,
          status: r.status,
          notes: r.notes,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOpen = async () => {
    if (!user) return;
    const amount = parseFloat(openingAmount.replace(",", "."));
    if (isNaN(amount) || amount < 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (currentOpen) {
      toast.error("Já existe um caixa aberto. Encerre antes de abrir um novo.");
      return;
    }
    const { error } = await supabase.from("cash_register").insert({
      user_id: user.id,
      date: today,
      opening_amount: amount,
      status: "open",
      notes: openingNotes || null,
    } as any);
    if (error) {
      const msg = (error.message || "").toString();
      if (msg.includes("CAIXA_ANTERIOR_ABERTO")) {
        toast.error("Existe um caixa de dia anterior em aberto. Encerre-o antes de abrir um novo.");
      } else {
        toast.error("Erro ao abrir caixa.");
      }
      return;
    }
    toast.success(`Caixa aberto com ${formatCurrency(amount)}`);
    setOpenDialog(false);
    setOpeningAmount("");
    setOpeningNotes("");
    loadData();
  };

  const handleClose = async () => {
    if (!currentOpen) return;
    const amount = parseFloat(closingAmount.replace(",", "."));
    if (isNaN(amount) || amount < 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    const { error } = await supabase
      .from("cash_register")
      .update({
        closing_amount: amount,
        closed_at: new Date().toISOString(),
        status: "closed",
        notes: closingNotes
          ? currentOpen.notes
            ? `${currentOpen.notes}\n[Encerramento]: ${closingNotes}`
            : closingNotes
          : currentOpen.notes,
      } as any)
      .eq("id", currentOpen.id);
    if (error) {
      toast.error("Erro ao encerrar caixa.");
      return;
    }
    toast.success(`Caixa encerrado com ${formatCurrency(amount)}`);
    setCloseDialog(false);
    setClosingAmount("");
    setClosingNotes("");
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("cash_register").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir registro.");
      return;
    }
    toast.info("Registro excluído.");
    setDeleteId(null);
    loadData();
  };

  const totalPages = Math.max(1, Math.ceil(registers.length / PAGE_SIZE));
  const paginated = useMemo(
    () => registers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [registers, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">💵 Controle de Caixa</h1>
        <div className="flex gap-2">
          {!currentOpen ? (
            <Button onClick={() => setOpenDialog(true)} className="gap-2" size="sm">
              <LockOpen className="h-4 w-4" />
              Abrir Caixa
            </Button>
          ) : (
            <Button onClick={() => setCloseDialog(true)} className="gap-2" size="sm" variant="destructive">
              <Lock className="h-4 w-4" />
              Encerrar Caixa
            </Button>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Caixa Atual</p>
              {currentOpen ? (
                <>
                  <p className="text-2xl font-bold font-['Space_Grotesk'] mt-1">
                    {formatCurrency(currentOpen.opening_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aberto em {currentOpen.date} ·{" "}
                    {new Date(currentOpen.opened_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Badge className="mt-2 bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
                    Aberto
                  </Badge>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold font-['Space_Grotesk'] mt-1 text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-1">Nenhum caixa aberto</p>
                  <Badge variant="secondary" className="mt-2">Fechado</Badge>
                </>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-primary/40" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Último Encerramento</p>
              {lastClosed ? (
                <>
                  <p className="text-2xl font-bold font-['Space_Grotesk'] mt-1">
                    {formatCurrency(lastClosed.closing_amount ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lastClosed.date}
                    {lastClosed.closed_at &&
                      ` · ${new Date(lastClosed.closed_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold font-['Space_Grotesk'] mt-1 text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-1">Sem histórico</p>
                </>
              )}
            </div>
            <Lock className="h-8 w-8 text-primary/40" />
          </div>
        </Card>
      </div>

      {/* Histórico */}
      <div>
        <h2 className="text-base font-semibold mb-3">Histórico de Caixas</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : registers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum registro de caixa ainda.</p>
        ) : (
          <>
            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              {paginated.map((r) => (
                <div key={r.id} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.date}</span>
                    <Badge variant={r.status === "open" ? "default" : "secondary"}>
                      {r.status === "open" ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Abertura</p>
                      <p className="font-['Space_Grotesk'] font-medium">{formatCurrency(r.opening_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Encerramento</p>
                      <p className="font-['Space_Grotesk'] font-medium">
                        {r.closing_amount !== null ? formatCurrency(r.closing_amount) : "—"}
                      </p>
                    </div>
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground whitespace-pre-line">{r.notes}</p>}
                  {canDelete && (
                    <Button variant="ghost" size="sm" className="text-destructive w-full" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="rounded-lg border bg-card overflow-hidden hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-4 font-medium text-muted-foreground">DATA</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">ABERTURA</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">ENCERRAMENTO</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">STATUS</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">OBSERVAÇÕES</th>
                    {canDelete && <th className="text-center p-4 font-medium text-muted-foreground">AÇÕES</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="p-4 font-medium">{r.date}</td>
                      <td className="p-4 text-right font-['Space_Grotesk']">{formatCurrency(r.opening_amount)}</td>
                      <td className="p-4 text-right font-['Space_Grotesk']">
                        {r.closing_amount !== null ? formatCurrency(r.closing_amount) : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={r.status === "open" ? "default" : "secondary"}>
                          {r.status === "open" ? "Aberto" : "Fechado"}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground max-w-[260px] truncate" title={r.notes ?? ""}>
                        {r.notes || "—"}
                      </td>
                      {canDelete && (
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, registers.length)} de {registers.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-3">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog: Abrir Caixa */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa — {today}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {lastClosed && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                Último encerramento: <strong>{formatCurrency(lastClosed.closing_amount ?? 0)}</strong> em {lastClosed.date}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="opening-amount">Valor de abertura (R$)</Label>
              <Input
                id="opening-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening-notes">Observações (opcional)</Label>
              <Textarea
                id="opening-notes"
                placeholder="Ex: troco inicial, observações..."
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleOpen}>Abrir Caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Encerrar Caixa */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {currentOpen && (
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                <div>Aberto em: <strong>{currentOpen.date}</strong></div>
                <div>Valor de abertura: <strong>{formatCurrency(currentOpen.opening_amount)}</strong></div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="closing-amount">Valor de fechamento (R$)</Label>
              <Input
                id="closing-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing-notes">Observações do encerramento (opcional)</Label>
              <Textarea
                id="closing-notes"
                placeholder="Ex: diferença de troco, observações..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)}>Cancelar</Button>
            <Button onClick={handleClose} variant="destructive">Encerrar Caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de caixa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}