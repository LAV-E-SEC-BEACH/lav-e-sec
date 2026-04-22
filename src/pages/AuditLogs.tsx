import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, RefreshCw, Eye } from "lucide-react";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

const TABLE_LABELS: Record<string, string> = {
  orders: "Ordens de Serviço",
  clients: "Clientes",
  expenses: "Despesas",
  profiles: "Perfis",
  support_tickets: "Tickets Suporte",
  user_roles: "Permissões",
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-accent/15 text-accent border-accent/30",
  UPDATE: "bg-primary/15 text-primary border-primary/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTable, setFilterTable] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (filterTable !== "all") {
      query = query.eq("table_name", filterTable);
    }
    if (filterAction !== "all") {
      query = query.eq("action", filterAction);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erro ao carregar logs:", error);
    } else {
      setLogs((data as AuditLog[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filterTable, filterAction]);

  const filtered = logs.filter(
    (l) =>
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.record_id?.toLowerCase().includes(search.toLowerCase()) ||
      (l.table_name && TABLE_LABELS[l.table_name]?.toLowerCase().includes(search.toLowerCase()))
  );

  const getChangedFields = (log: AuditLog): string[] => {
    if (log.action !== "UPDATE" || !log.old_data || !log.new_data) return [];
    const changed: string[] = [];
    for (const key of Object.keys(log.new_data)) {
      if (JSON.stringify(log.old_data[key]) !== JSON.stringify(log.new_data[key])) {
        changed.push(key);
      }
    }
    return changed;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-foreground">Logs do Sistema</h2>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou tabela..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tabela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tabelas</SelectItem>
            <SelectItem value="orders">Ordens de Serviço</SelectItem>
            <SelectItem value="clients">Clientes</SelectItem>
            <SelectItem value="expenses">Despesas</SelectItem>
            <SelectItem value="profiles">Perfis</SelectItem>
            <SelectItem value="support_tickets">Tickets Suporte</SelectItem>
            <SelectItem value="user_roles">Permissões</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="INSERT">Criação</SelectItem>
            <SelectItem value="UPDATE">Atualização</SelectItem>
            <SelectItem value="DELETE">Exclusão</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Alterações</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => {
                  const changedFields = getChangedFields(log);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm">{log.user_email || "Sistema"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ACTION_COLORS[log.action] || ""}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                        {log.action === "UPDATE" && changedFields.length > 0
                          ? changedFields.join(", ")
                          : log.action === "DELETE"
                            ? "Registro excluído"
                            : log.action === "INSERT"
                              ? "Novo registro"
                              : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailLog} onOpenChange={(o) => !o && setDetailLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-muted-foreground">Data/Hora:</span>
                  <p>{new Date(detailLog.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Usuário:</span>
                  <p>{detailLog.user_email || "Sistema"}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Tabela:</span>
                  <p>{TABLE_LABELS[detailLog.table_name] || detailLog.table_name}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Ação:</span>
                  <p>
                    <Badge variant="outline" className={ACTION_COLORS[detailLog.action] || ""}>
                      {ACTION_LABELS[detailLog.action] || detailLog.action}
                    </Badge>
                  </p>
                </div>
              </div>

              {detailLog.action === "UPDATE" && detailLog.old_data && detailLog.new_data && (
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Campos alterados:</h4>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left px-3 py-2 font-medium">Campo</th>
                          <th className="text-left px-3 py-2 font-medium">Antes</th>
                          <th className="text-left px-3 py-2 font-medium">Depois</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getChangedFields(detailLog).map((field) => (
                          <tr key={field} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{field}</td>
                            <td className="px-3 py-2 text-destructive">
                              {JSON.stringify(detailLog.old_data![field])}
                            </td>
                            <td className="px-3 py-2 text-accent">
                              {JSON.stringify(detailLog.new_data![field])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailLog.action === "DELETE" && detailLog.old_data && (
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Dados excluídos:</h4>
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(detailLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {detailLog.action === "INSERT" && detailLog.new_data && (
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Dados criados:</h4>
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(detailLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}