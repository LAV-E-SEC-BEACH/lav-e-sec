import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Props {
  onImported: () => void;
}

export function ClientUpload({ onImported }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        toast.error("Planilha vazia.");
        setLoading(false);
        return;
      }

      // Try to detect column names (case-insensitive)
      const findCol = (row: any, options: string[]) => {
        const keys = Object.keys(row);
        for (const opt of options) {
          const found = keys.find((k) => k.toLowerCase().trim() === opt.toLowerCase());
          if (found) return found;
        }
        return null;
      };

      const sampleRow = rows[0];
      const nameCol = findCol(sampleRow, ["nome", "name", "cliente", "client"]);
      const phoneCol = findCol(sampleRow, ["telefone", "phone", "celular", "whatsapp", "fone", "tel"]);
      const addressCol = findCol(sampleRow, ["endereço", "endereco", "address", "end"]);

      if (!nameCol || !phoneCol) {
        toast.error("A planilha deve ter colunas 'Nome' e 'Telefone'.");
        setLoading(false);
        return;
      }

      const clients = rows
        .filter((r) => r[nameCol] && r[phoneCol])
        .map((r) => ({
          user_id: user.id,
          name: String(r[nameCol]).trim(),
          phone: String(r[phoneCol]).trim(),
          address: addressCol ? String(r[addressCol]).trim() : "",
        }));

      if (clients.length === 0) {
        toast.error("Nenhum cliente válido encontrado.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("clients").insert(clients);
      if (error) {
        toast.error("Erro ao importar: " + error.message);
      } else {
        toast.success(`${clients.length} cliente(s) importado(s) com sucesso!`);
        onImported();
      }
    } catch (err) {
      toast.error("Erro ao ler a planilha.");
    }
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" className="gap-2" disabled={loading} onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" />
        {loading ? "Importando..." : "Importar Planilha"}
      </Button>
    </>
  );
}
