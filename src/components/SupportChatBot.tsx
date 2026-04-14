import { useState } from "react";
import { MessageCircle, X, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "welcome" | "description" | "sent";

export function SupportChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<{ name: string; phone: string }>({ name: "", phone: "" });

  const startChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    setProfileData({
      name: data?.display_name || user.user_metadata?.full_name || "Não informado",
      phone: data?.phone || "Não informado",
    });
    setStep("description");
  };

  const handleSend = async () => {
    if (!description.trim()) {
      toast.error("Por favor, descreva o problema.");
      return;
    }
    if (!user) return;

    setLoading(true);
    const summary = description.length > 60 ? description.substring(0, 60) + "..." : description;

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      name: profileData.name,
      phone: profileData.phone,
      summary,
      description: description.trim(),
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao enviar chamado. Tente novamente.");
      return;
    }

    setStep("sent");
    toast.success("Chamado enviado com sucesso!");
  };

  const handleClose = () => {
    setOpen(false);
    setStep("welcome");
    setDescription("");
  };

  const handleToggle = () => {
    if (open) {
      handleClose();
    } else {
      setOpen(true);
      startChat();
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold text-sm">Suporte LAV & SEC BEACH</span>
          </div>

          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {step === "description" && (
              <>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  Olá, <strong>{profileData.name}</strong>! 👋<br />
                  Descreva o problema que você está enfrentando e enviaremos para o suporte.
                </div>
                <Textarea
                  placeholder="Descreva seu problema aqui..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-sm"
                  maxLength={1000}
                />
                <Button onClick={handleSend} size="sm" className="w-full gap-2" disabled={loading}>
                  <Send className="h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar Chamado"}
                </Button>
              </>
            )}

            {step === "sent" && (
              <div className="text-center space-y-3 py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm font-medium">Chamado enviado com sucesso!</p>
                <p className="text-xs text-muted-foreground">Nossa equipe de suporte será notificada e entrará em contato.</p>
                <Button onClick={handleClose} size="sm" variant="outline" className="w-full">
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
