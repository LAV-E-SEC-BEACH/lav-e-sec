import { useState } from "react";
import { WashingMachine, LayoutDashboard, ClipboardList, Users, Receipt, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileDialog } from "./ProfileDialog";

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
  const { signOut, user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <aside className="w-60 min-h-screen bg-primary text-primary-foreground flex flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-primary-foreground/10">
          <WashingMachine className="h-7 w-7" />
          <span className="text-lg font-bold tracking-tight font-['Space_Grotesk']">
            LAV & SEV BEACH
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
        <div className="px-3 pb-4 border-t border-primary-foreground/10 pt-3 space-y-2">
          <p className="text-xs text-primary-foreground/60 px-3 truncate">{user?.email}</p>
          <button
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors text-left"
          >
            <Settings className="h-4.5 w-4.5" />
            Editar Perfil
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors text-left"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sair
          </button>
        </div>
      </aside>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
