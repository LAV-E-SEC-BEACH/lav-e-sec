import { useMemo, useState } from "react";
import { Order, formatCurrency, formatDate, PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/laundry";
import { Expense, CATEGORY_LABELS, CATEGORY_COLORS, ExpenseCategory } from "@/lib/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBasket, Download, CalendarIcon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  orders: Order[];
  expenses: Expense[];
}

function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DashboardPage({ orders, expenses }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => getYesterday());

  const selectedDateStr = formatDate(selectedDate);

  const dayOrders = useMemo(
    () => orders.filter((o) => o.date === selectedDateStr),
    [orders, selectedDateStr]
  );
  const dayExpenses = useMemo(
    () => expenses.filter((e) => e.date === selectedDateStr),
    [expenses, selectedDateStr]
  );

  const dayRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
  const dayExpensesTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
  const dayProfit = dayRevenue - dayExpensesTotal;

  const handleExportDashboard = () => {
    if (dayOrders.length === 0 && dayExpenses.length === 0) {
      toast.error("Nenhum dado para exportar nesta data");
      return;
    }

    const totals = {
      atendimentos: dayOrders.length,
      cestos: dayOrders.reduce((s, o) => s + o.baskets, 0),
      receita: dayRevenue,
      pix: 0,
      credito: 0,
      debito: 0,
      dinheiro: 0,
      semPagamento: 0,
    };
    dayOrders.forEach((o) => {
      if (o.paymentMethod) totals[o.paymentMethod as PaymentMethod] += o.total;
      else totals.semPagamento += o.total;
    });

    const rows: string[][] = [];
    rows.push([`Relatório do dia ${selectedDateStr}`]);
    rows.push([]);
    rows.push(["Resumo do Dia"]);
    rows.push(["Atendimentos", String(totals.atendimentos)]);
    rows.push(["Cestos", String(totals.cestos)]);
    rows.push(["Receita Total", formatCurrency(totals.receita)]);
    rows.push(["Pix", formatCurrency(totals.pix)]);
    rows.push(["Crédito", formatCurrency(totals.credito)]);
    rows.push(["Débito", formatCurrency(totals.debito)]);
    rows.push(["Dinheiro", formatCurrency(totals.dinheiro)]);
    rows.push(["Sem Pagamento", formatCurrency(totals.semPagamento)]);
    rows.push(["Despesas", formatCurrency(dayExpensesTotal)]);
    rows.push(["Lucro do Dia", formatCurrency(dayProfit)]);

    rows.push([]);
    rows.push(["Detalhamento de Atendimentos"]);
    rows.push(["Cliente", "Telefone", "Cestos", "Forma de Pagamento", "Status", "Total"]);
    dayOrders.forEach((o) => {
      rows.push([
        o.name,
        o.phone,
        String(o.baskets),
        o.paymentMethod ? PAYMENT_METHOD_LABELS[o.paymentMethod as PaymentMethod] : "Sem pagamento",
        o.status,
        formatCurrency(o.total),
      ]);
    });

    rows.push([]);
    rows.push(["Detalhamento de Despesas"]);
    rows.push(["Descrição", "Categoria", "Valor"]);
    dayExpenses.forEach((ex) => {
      rows.push([ex.description, CATEGORY_LABELS[ex.category], formatCurrency(ex.amount)]);
    });

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${selectedDateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado com sucesso!");
  };

  // Revenue vs Expenses by payment method (apenas dia selecionado)
  const revenueByMethod = useMemo(() => {
    const methods: { name: string; receita: number }[] = [
      { name: "Pix", receita: 0 },
      { name: "Crédito", receita: 0 },
      { name: "Débito", receita: 0 },
      { name: "Dinheiro", receita: 0 },
      { name: "Sem Pgto", receita: 0 },
    ];
    dayOrders.forEach((o) => {
      if (o.paymentMethod === "pix") methods[0].receita += o.total;
      else if (o.paymentMethod === "credito") methods[1].receita += o.total;
      else if (o.paymentMethod === "debito") methods[2].receita += o.total;
      else if (o.paymentMethod === "dinheiro") methods[3].receita += o.total;
      else methods[4].receita += o.total;
    });
    return methods.filter((m) => m.receita > 0);
  }, [dayOrders]);

  const statusData = useMemo(() => {
    const counts = { washing: 0, ready: 0, picked_up: 0 };
    dayOrders.forEach((o) => counts[o.status]++);
    return [
      { name: "Em Lavagem", value: counts.washing, color: "hsl(38, 92%, 50%)" },
      { name: "Pronto", value: counts.ready, color: "hsl(150, 60%, 40%)" },
      { name: "Finalizado", value: counts.picked_up, color: "hsl(210, 70%, 45%)" },
    ].filter((d) => d.value > 0);
  }, [dayOrders]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    dayExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([cat, amount]) => ({
      name: CATEGORY_LABELS[cat],
      value: amount,
      color: CATEGORY_COLORS[cat],
    }));
  }, [dayExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📊 Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exibindo dados de {format(selectedDate, "PPP", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecionar data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleExportDashboard} variant="outline" className="gap-2" size="sm">
            <Download className="h-4 w-4" />
            Exportar Planilha
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Atendimentos</p>
              <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1">{dayOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Receita</p>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1 text-accent">{formatCurrency(dayRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Despesas</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1 text-destructive">{formatCurrency(dayExpensesTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Lucro do Dia</p>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className={`text-3xl font-bold font-['Space_Grotesk'] mt-1 ${dayProfit >= 0 ? "text-accent" : "text-destructive"}`}>
              {formatCurrency(dayProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Receita por Forma de Pagamento</CardTitle></CardHeader>
          <CardContent>
            {revenueByMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados nesta data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByMethod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="receita" name="Receita" fill="hsl(170, 60%, 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Status das Ordens</CardTitle></CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem ordens nesta data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((d, i) => (<Cell key={i} fill={d.color} />))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category + Day Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma despesa nesta data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                    {expensesByCategory.map((d, i) => (<Cell key={i} fill={d.color} />))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Despesas do Dia</CardTitle></CardHeader>
          <CardContent>
            {dayExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma despesa nesta data</p>
            ) : (
              <div className="overflow-auto max-h-[250px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Descrição</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Categoria</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayExpenses.map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-2">{e.description}</td>
                        <td className="py-2"><Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[e.category]}</Badge></td>
                        <td className="py-2 text-right font-['Space_Grotesk'] font-medium text-destructive">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
