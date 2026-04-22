import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { KeyRound, Shield, Ban, Trash2, Search, RefreshCw } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  phone: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  support: "Suporte",
  atendente: "Atendente",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/30",
  support: "bg-accent/15 text-accent border-accent/30",
  atendente: "bg-primary/15 text-primary border-primary/30",
};

export function AdminUsers() {
  const { session } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Reset password state
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Change role state
  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [changingRole, setChangingRole] = useState(false);

  // Ban/delete state
  const [banUser, setBanUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/admin-users?action=list`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        toast.error(data.error || "Erro ao carregar usuários");
      }
    } catch (err: any) {
      toast.error("Erro ao carregar usuários");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchUsers();
  }, [session]);

  const invokeAction = async (action: string, body: Record<string, unknown>) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/admin-users?action=${action}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword) return;
    setResetting(true);
    try {
      const result = await invokeAction("reset-password", {
        userId: resetUser.id,
        newPassword,
      });
      if (result.success) {
        toast.success("Senha alterada com sucesso!");
        setResetUser(null);
        setNewPassword("");
      } else {
        toast.error(result.error || "Erro ao alterar senha");
      }
    } catch {
      toast.error("Erro ao alterar senha");
    }
    setResetting(false);
  };

  const handleChangeRole = async () => {
    if (!roleUser || !selectedRole) return;
    setChangingRole(true);
    try {
      const result = await invokeAction("change-role", {
        userId: roleUser.id,
        newRole: selectedRole,
      });
      if (result.success) {
        toast.success("Permissão alterada com sucesso!");
        setRoleUser(null);
        fetchUsers();
      } else {
        toast.error(result.error || "Erro ao alterar permissão");
      }
    } catch {
      toast.error("Erro ao alterar permissão");
    }
    setChangingRole(false);
  };

  const handleToggleBan = async () => {
    if (!banUser) return;
    try {
      const result = await invokeAction("toggle-ban", {
        userId: banUser.id,
        ban: !banUser.banned,
      });
      if (result.success) {
        toast.success(banUser.banned ? "Usuário reativado!" : "Usuário desativado!");
        setBanUser(null);
        fetchUsers();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const result = await invokeAction("delete", { userId: deleteUser.id });
      if (result.success) {
        toast.success("Usuário excluído!");
        setDeleteUser(null);
        fetchUsers();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao excluir usuário");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-foreground">Gerenciar Usuários</h2>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id} className={u.banned ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_COLORS[u.role] || ""}>
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.banned ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          Inativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Resetar Senha"
                          onClick={() => {
                            setResetUser(u);
                            setNewPassword("");
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Alterar Permissão"
                          onClick={() => {
                            setRoleUser(u);
                            setSelectedRole(u.role);
                          }}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={u.banned ? "Reativar" : "Desativar"}
                          onClick={() => setBanUser(u)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteUser(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Usuário: <strong>{resetUser?.email}</strong>
          </p>
          <Input
            type="password"
            placeholder="Nova senha (mínimo 6 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6}>
              {resetting ? "Salvando..." : "Salvar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleUser} onOpenChange={(o) => !o && setRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Permissão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Usuário: <strong>{roleUser?.email}</strong>
          </p>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
              <SelectItem value="atendente">Atendente</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeRole} disabled={changingRole}>
              {changingRole ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Confirmation */}
      <AlertDialog open={!!banUser} onOpenChange={(o) => !o && setBanUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banUser?.banned ? "Reativar Usuário" : "Desativar Usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banUser?.banned
                ? `Deseja reativar o acesso de ${banUser?.email}?`
                : `Deseja desativar o acesso de ${banUser?.email}? O usuário não poderá fazer login.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleBan}>
              {banUser?.banned ? "Reativar" : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o usuário{" "}
              <strong>{deleteUser?.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}