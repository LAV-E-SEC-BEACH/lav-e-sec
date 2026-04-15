import { useState, useEffect } from "react";
import { LayoutDashboard, ClipboardList, Users, Receipt, LogOut, Settings, Menu, Headset } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileDialog } from "./ProfileDialog";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Ordens de Serviço", icon: ClipboardList },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "expenses", label: "Despesas", icon: Receipt },
  { id: "support", label: "Suporte", icon: Headset },
];

function SidebarContent({ currentPage, onNavigate, onItemClick }: Props & { onItemClick?: () => void }) {
  const { signOut, user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.display_name) setDisplayName(data.display_name);
        });
    }
  }, [user, profileOpen]);

  const handleNav = (page: string) => {
    onNavigate(page);
    onItemClick?.();
  };

  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-primary-foreground/10">
        <img src={logo} alt="LAV & SEC Beach" className="h-10 w-10 object-contain" />
        <span className="text-lg font-bold tracking-tight font-['Space_Grotesk']">
          LAV & SEC BEACH
        </span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
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
        <p className="text-sm font-medium text-primary-foreground px-3 truncate">{displayName || user?.user_metadata?.full_name || "Usuário"}</p>
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
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

export function AppSidebar({ currentPage, onNavigate }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 bg-primary text-primary-foreground border-none">
          <div className="flex flex-col h-full">
            <SidebarContent currentPage={currentPage} onNavigate={onNavigate} onItemClick={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-60 min-h-screen bg-primary text-primary-foreground flex flex-col">
      <SidebarContent currentPage={currentPage} onNavigate={onNavigate} />
    </aside>
  );
}
