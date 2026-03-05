export type ExpenseCategory =
  | "agua"
  | "luz"
  | "aluguel"
  | "produtos"
  | "funcionarios"
  | "manutencao"
  | "outros";

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  agua: "Água",
  luz: "Luz",
  aluguel: "Aluguel",
  produtos: "Produtos de Limpeza",
  funcionarios: "Funcionários",
  manutencao: "Manutenção",
  outros: "Outros",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  agua: "hsl(200, 70%, 50%)",
  luz: "hsl(45, 90%, 50%)",
  aluguel: "hsl(280, 60%, 50%)",
  produtos: "hsl(170, 60%, 42%)",
  funcionarios: "hsl(340, 65%, 50%)",
  manutencao: "hsl(25, 80%, 50%)",
  outros: "hsl(215, 15%, 55%)",
};
