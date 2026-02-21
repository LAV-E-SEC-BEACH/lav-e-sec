export const PRICE_PER_BASKET = 17;

export interface Order {
  id: string;
  date: string;
  name: string;
  phone: string;
  baskets: number;
  total: number;
  status: "washing" | "ready" | "picked_up";
}

export function calculateTotal(baskets: number): number {
  return baskets * PRICE_PER_BASKET;
}

export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

export function generateEntryMessage(name: string, baskets: number, total: number): string {
  return `Olá, ${name} 😊\nRecebemos suas roupas com ${baskets} cesto(s).\nO valor total do serviço de lavagem e secagem é ${formatCurrency(total)}.\nAvisaremos assim que estiver tudo pronto!`;
}

export function generatePickupMessage(name: string): string {
  return `Olá, ${name} 👕✨\nSuas roupas já estão limpas, secas e disponíveis para retirada.\nQualquer dúvida, estamos à disposição!`;
}

export function generateSpreadsheetRow(order: Order): string {
  return `${order.date} | ${order.name} | ${order.phone} | ${order.baskets} | ${formatCurrency(order.total)}`;
}

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
