import { useMemo } from "react";
import { Order, formatCurrency, formatDate } from "@/lib/laundry";
import { Expense, CATEGORY_LABELS, CATEGORY_COLORS, ExpenseCategory } from "@/lib/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingBasket } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface Props {
  orders: Order[];
  expenses: Expense[];
  onAddExpense: () => void;
}

export function DashboardPage({ orders, expenses, onAddExpense }: Props) {
  const today = formatDate(new Date());
  const todayOrders = orders.filter((o) => o.date === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const todayExpenses = expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  // Revenue by day (last 7 unique dates)
  const revenueByDay = useMemo(() => {
    const map = new Map<string, { receita: number; despesas: number }>();
    orders.forEach((o) => {
      const entry = map.get(o.date) || { receita: 0, despesas: 0 };
      entry.receita += o.total;
      map.set(o.date, entry);
    });
    expenses.forEach((e) => {
      const entry = map.get(e.date) || { receita: 0, despesas: 0 };
      entry.despesas += e.amount;
      map.set(e.date, entry);
    });
    return Array.from(map.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [orders, expenses]);

  // Status pie chart
  const statusData = useMemo(() => {
    const counts = { washing: 0, ready: 0, picked_up: 0 };
    orders.forEach((o) => counts[o.status]++);
    return [
      { name: "Em Lavagem", value: counts.washing, color: "hsl(38, 92%, 50%)" },
      { name: "Pronto", value: counts.ready, color: "hsl(150, 60%, 40%)" },
      { name: "Finalizado", value: counts.picked_up, color: "hsl(210, 70%, 45%)" },
    ].filter((d) => d.value > 0);
  }, [orders]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([cat, amount]) => ({
      name: CATEGORY_LABELS[cat],
      value: amount,
      color: CATEGORY_COLORS[cat],
    }));
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">📊 Dashboard</h1>
        <Button onClick={onAddExpense} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Atendimentos Hoje</p>
              <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1">{todayOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Receita Hoje</p>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1 text-accent">{formatCurrency(todayRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Despesas Hoje</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-3xl font-bold font-['Space_Grotesk'] mt-1 text-destructive">{formatCurrency(todayExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Lucro Total</p>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className={`text-3xl font-bold font-['Space_Grotesk'] mt-1 ${profit >= 0 ? "text-accent" : "text-destructive"}`}>
              {formatCurrency(profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receita vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados ainda</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="receita" name="Receita" fill="hsl(170, 60%, 42%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status das Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem ordens registradas</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma despesa registrada</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                    {expensesByCategory.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Últimas Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma despesa registrada</p>
            ) : (
              <div className="overflow-auto max-h-[250px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Data</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Descrição</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Categoria</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice(0, 10).map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-2">{e.date}</td>
                        <td className="py-2">{e.description}</td>
                        <td className="py-2">
                          <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[e.category]}</Badge>
                        </td>
                        <td className="py-2 text-right font-['Space_Grotesk'] font-medium text-destructive">
                          {formatCurrency(e.amount)}
                        </td>
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
