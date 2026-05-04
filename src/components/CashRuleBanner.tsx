import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wallet } from "lucide-react";
import { formatDate } from "@/lib/laundry";

// Regras valem a partir de 04/05/2026 às 20:00 (horário de Brasília)
const RULES_ACTIVE_AT = new Date("2026-05-04T20:00:00-03:00");

interface Props {
  onGoToCash: () => void;
}

export function CashRuleBanner({ onGoToCash }: Props) {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [hasOpenToday, setHasOpenToday] = useState<boolean | null>(null);
  const [hasPendingPrevious, setHasPendingPrevious] = useState<boolean>(false);
  const [tick, setTick] = useState(0);

  // Re-check periodicamente para pegar o momento de ativação sem refresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    const today = formatDate(new Date());
    (async () => {
      const { data } = await supabase
        .from("cash_register")
        .select("date, status")
        .eq("user_id", user.id)
        .eq("status", "open");
      if (!data) {
        setHasOpenToday(false);
        setHasPendingPrevious(false);
        return;
      }
      setHasOpenToday(data.some((r: any) => r.date === today));
      setHasPendingPrevious(data.some((r: any) => r.date < today));
    })();
  }, [user, tick]);

  // Não mostra banner antes da ativação ou para não-atendentes
  if (new Date() < RULES_ACTIVE_AT) return null;
  if (role !== "atendente") return null;
  if (hasOpenToday === null) return null;

  if (hasPendingPrevious) {
    return (
      <Alert variant="destructive" className="border-destructive/40">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Caixa pendente de dia anterior</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>
            Existe um caixa de um dia anterior ainda em aberto. Você precisa encerrá-lo antes de abrir o caixa de hoje.
          </span>
          <Button size="sm" variant="outline" onClick={onGoToCash}>
            <Wallet className="h-4 w-4" /> Ir para Caixa
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasOpenToday) {
    return (
      <Alert className="border-primary/40 bg-primary/5">
        <Wallet className="h-4 w-4" />
        <AlertTitle>Abra o caixa para começar o dia</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>
            Você precisa abrir o caixa do dia antes de criar novas ordens de serviço.
          </span>
          <Button size="sm" onClick={onGoToCash}>
            <Wallet className="h-4 w-4" /> Abrir caixa agora
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}