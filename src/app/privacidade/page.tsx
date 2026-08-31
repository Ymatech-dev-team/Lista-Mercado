import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade — Meu Mercado" };

// Rascunho mínimo para o MVP (LGPD). Revisar/expandir com texto jurídico antes de produção pública.
export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-[26px] font-semibold text-ink">Política de Privacidade</h1>
      <p className="mb-8 text-sm text-muted">Última atualização: 31 de agosto de 2026</p>

      <div className="space-y-5 text-base text-ink">
        <p>
          O Meu Mercado leva a sério a sua privacidade. Coletamos apenas o necessário para o app funcionar:
          seu <strong>e-mail</strong> (para login e recuperação de conta) e as <strong>listas de compras</strong>{" "}
          que você cria.
        </p>
        <p>
          <strong>Como usamos.</strong> Seus dados servem só para operar o app — guardar suas listas e mostrar
          o que você mais compra. Não vendemos nem compartilhamos seus dados com terceiros.
        </p>
        <p>
          <strong>Segurança.</strong> Sua senha é guardada de forma cifrada (hash) e nunca em texto puro.
        </p>
        <p>
          <strong>Seus direitos (LGPD).</strong> Você pode, a qualquer momento, excluir sua conta e todos os
          seus dados. Também pode solicitar uma cópia dos seus dados.
        </p>
        <p>
          <strong>Contato.</strong> Dúvidas sobre seus dados? Fale com a gente pelo e-mail de suporte.
        </p>
      </div>
    </main>
  );
}
