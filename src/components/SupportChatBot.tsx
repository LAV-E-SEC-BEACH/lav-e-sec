import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneForWhatsApp } from "@/lib/laundry";
import { toast } from "sonner";

const SUPPORT_PHONE = "11993391733";

type Step = "idle" | "description" | "confirm";

export function SupportChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [description, setDescription] = useState("");
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

  const handleSend = () => {
    if (!description.trim()) {
      toast.error("Por favor, descreva o problema.");
      return;
    }

    const summary = description.length > 60 ? description.substring(0, 60) + "..." : description;

    const message = `🛠️ *CHAMADO DE SUPORTE - LAV & SEC BEACH*\n\n👤 *Nome:* ${profileData.name}\n📞 *Telefone:* ${profileData.phone}\n📋 *Resumo:* ${summary}\n\n📝 *Descrição completa:*\n${description}`;

    const url = `https://wa.me/${formatPhoneForWhatsApp(SUPPORT_PHONE)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    toast.success("Redirecionando para o WhatsApp do suporte...");
    setDescription("");
    setStep("idle");
    setOpen(false);
  };

  const messages: { from: "bot" | "user"; text: string }[] = [];

  if (step === "idle") {
    messages.push({ from: "bot", text: "Olá! 👋 Precisa de ajuda? Clique no botão abaixo para abrir um chamado de suporte." });
  } else if (step === "description") {
    messages.push({ from: "bot", text: `Olá, *${profileData.name}*! Descreva o problema que você está enfrentando:` });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(!open); if (!open && step === "idle") startChat(); }}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border bg-card shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold text-sm">Suporte LAV & SEC BEACH</span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 max-h-72 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${m.from === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                  {m.text}
                </div>
              </div>
            ))}

            {step === "description" && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Descreva seu problema aqui..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-sm"
                />
                <Button onClick={handleSend} size="sm" className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Enviar via WhatsApp
                </Button>
              </div>
            )}

            {step === "idle" && (
              <Button onClick={startChat} size="sm" variant="outline" className="w-full">
                Abrir Chamado
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
