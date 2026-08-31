import { Resend } from "resend";

// Remetente: usa o domínio de teste do Resend até termos domínio próprio verificado.
const FROM = "Meu Mercado <onboarding@resend.dev>";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // Plano B de DEV (sem RESEND_API_KEY): imprime no console do servidor para não travar
    // o desenvolvimento. Só em dev — nunca em produção (lá a chave existe).
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email · dev] para: ${to}\nassunto: ${subject}\n${html}\n`);
      return;
    }
    throw new Error("RESEND_API_KEY ausente em produção.");
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export function sendVerificationEmail(to: string, link: string) {
  return send(
    to,
    "Confirme seu e-mail — Meu Mercado",
    `<p>Bem-vindo ao Meu Mercado!</p>
     <p>Confirme seu e-mail para ativar sua conta (o link expira em 24 horas):</p>
     <p><a href="${link}">Confirmar meu e-mail</a></p>
     <p>Se você não criou esta conta, ignore este e-mail.</p>`
  );
}

// Enviado quando alguém tenta cadastrar um e-mail que JÁ tem conta.
// Evita revelar na tela que a conta existe (anti-enumeração, design.md §4).
export function sendAccountExistsEmail(to: string, loginUrl: string) {
  return send(
    to,
    "Você já tem uma conta — Meu Mercado",
    `<p>Alguém tentou criar uma conta no Meu Mercado com este e-mail — mas você já tem uma.</p>
     <p>Se foi você, é só <a href="${loginUrl}">entrar</a>. Esqueceu a senha? Use a recuperação na tela de login.</p>
     <p>Se não foi você, pode ignorar este e-mail com segurança.</p>`
  );
}
