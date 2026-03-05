import { WashingMachine, LayoutDashboard, ClipboardList, Users, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Ordens de Serviço", icon: ClipboardList },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "expenses", label: "Despesas", icon: Receipt },
];

export function AppSidebar({ currentPage, onNavigate }: Props) {
  return (
    <aside className="w-60 min-h-screen bg-primary text-primary-foreground flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-primary-foreground/10">
        <WashingMachine className="h-7 w-7" />
        <span className="text-lg font-bold tracking-tight font-['Space_Grotesk']">
          LavanderiaApp
        </span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              currentPage === item.id
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
