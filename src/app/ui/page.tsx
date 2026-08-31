"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ListItem } from "@/components/ui/list-item";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HomeIcon, ListIcon, ClockIcon, UserIcon } from "@/components/icons";

const swatches = [
  { name: "primary", token: "ação / verde", className: "bg-primary" },
  { name: "accent-fill", token: "check / progresso", className: "bg-accent-fill" },
  { name: "ink", token: "texto", className: "bg-ink" },
  { name: "muted", token: "secundário", className: "bg-muted" },
  { name: "danger", token: "excluir", className: "bg-danger" },
  { name: "warning", token: "aviso", className: "bg-warning" },
  { name: "info", token: "dica", className: "bg-info" },
  { name: "hairline", token: "borda", className: "bg-hairline" },
];

function Label({ children }: { children: string }) {
  return <p className="mb-4 font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.08em] text-muted">{children}</p>;
}

type Item = { id: number; name: string; qtd: string; checked: boolean };
const initialItems: Item[] = [
  { id: 1, name: "Arroz", qtd: "5 kg", checked: true },
  { id: 2, name: "Café", qtd: "2", checked: true },
  { id: 3, name: "Banana", qtd: "1 dz", checked: false },
  { id: 4, name: "Leite", qtd: "6", checked: false },
];

export default function UiPage() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const done = items.filter((i) => i.checked).length;

  function toggle(id: number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }
  function remove(id: number) {
    const snapshot = items;
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast(`${item?.name} removido`, { action: { label: "Desfazer", onClick: () => setItems(snapshot) } });
  }
  function fakeLoad() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 pb-28">
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.08em] text-muted">design-system · mercadinho</p>
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight tracking-tight text-ink">Meu Mercado</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Tipografia */}
      <section className="mb-12">
        <Label>tipografia</Label>
        <Card className="space-y-3">
          <p className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-ink">Display · Familjen 28</p>
          <p className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight text-ink">Título de tela · H1 22</p>
          <p className="font-[family-name:var(--font-display)] text-[18px] font-medium text-ink">Seção · H2 18</p>
          <p className="text-base text-ink">Corpo · Hanken 16 — o texto que você lê sem esforço.</p>
          <p className="text-sm text-muted">Small 14 · metadados e ajuda</p>
          <p className="font-[family-name:var(--font-num)] tabular-nums text-base text-num">
            Números · DM Mono <span className="text-ink">5&nbsp;kg</span> · <span className="text-ink">R$&nbsp;12,90</span> · 3/8
          </p>
        </Card>
      </section>

      {/* Cores */}
      <section className="mb-12">
        <Label>cores</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.name} className="rounded-xl border border-hairline bg-surface p-3">
              <div className={`mb-2 h-12 w-full rounded-lg ${s.className}`} />
              <p className="text-sm font-medium text-ink">{s.name}</p>
              <p className="text-xs text-muted">{s.token}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Botões */}
      <section className="mb-12">
        <Label>botões e estados</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Nova lista</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive-ghost">Excluir</Button>
          <Button loading={loading} onClick={fakeLoad}>{loading ? "Salvando" : "Testar loading"}</Button>
          <Button disabled>Desabilitado</Button>
        </div>
      </section>

      {/* Formulário */}
      <section className="mb-12">
        <Label>campos</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ex-email" className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
            <Input id="ex-email" type="email" placeholder="voce@email.com" />
          </div>
          <div>
            <label htmlFor="ex-qtd" className="mb-1.5 block text-sm font-medium text-ink">Quantidade</label>
            <Input id="ex-qtd" inputMode="numeric" defaultValue="1" className="font-[family-name:var(--font-num)] tabular-nums" />
          </div>
          <div>
            <label htmlFor="ex-err" className="mb-1.5 block text-sm font-medium text-ink">Campo com erro</label>
            <Input id="ex-err" error="Digite o nome do item." placeholder="Nome do item" />
          </div>
          <div className="flex items-end">
            <Checkbox defaultChecked label="Li e aceito a política de privacidade" />
          </div>
        </div>
      </section>

      {/* Card com lista — componente-assinatura */}
      <section className="mb-12">
        <Label>lista (marque os itens)</Label>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.08em] text-muted">lista ativa</p>
              <h3 className="font-[family-name:var(--font-display)] text-[17px] font-medium text-ink">Compras da semana</h3>
            </div>
            <span className="font-[family-name:var(--font-num)] tabular-nums text-xs font-medium text-primary-strong">{done}/{items.length}</span>
          </div>
          <Progress value={items.length ? (done / items.length) * 100 : 0} className="my-4" label="Progresso da lista" />
          {items.length ? (
            <ul>
              {items.map((it) => (
                <li key={it.id}>
                  <ListItem
                    name={it.name}
                    quantity={it.qtd}
                    checked={it.checked}
                    onToggle={() => toggle(it.id)}
                    onRemove={() => remove(it.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted">Todos os itens foram removidos. Recarregue a página para restaurar.</p>
          )}
        </Card>
      </section>

      {/* Chips */}
      <section className="mb-12">
        <Label>você sempre compra (toque pra adicionar)</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { n: "Arroz", f: "12×" },
            { n: "Leite", f: "11×" },
            { n: "Café", f: "9×" },
            { n: "Ovos", f: "8×" },
            { n: "Pão", f: "7×" },
          ].map((c) => (
            <Chip key={c.n} label={c.n} meta={c.f} onAdd={() => toast(`${c.n} adicionado à lista`)} />
          ))}
        </div>
      </section>

      {/* Confirmação + Empty state */}
      <section className="mb-12 grid gap-6 sm:grid-cols-2">
        <div>
          <Label>confirmação</Label>
          <ConfirmDialog
            trigger={<Button variant="destructive-ghost">Excluir lista</Button>}
            title="Excluir esta lista?"
            description="Esta ação não pode ser desfeita. A lista e seus itens serão removidos."
            confirmLabel="Excluir"
            destructive
            onConfirm={() => toast("Lista excluída")}
          />
        </div>
        <div>
          <Label>estado vazio</Label>
          <EmptyState
            title="Sua lista está vazia"
            description="Adicione o primeiro item e comece a montar suas compras."
            action={<Button>Adicionar item</Button>}
          />
        </div>
      </section>

      {/* Bottom nav */}
      <section className="mb-4">
        <Label>navegação (mobile)</Label>
        <div className="overflow-hidden rounded-xl border border-hairline">
          <BottomNav
            items={[
              { label: "Início", icon: <HomeIcon />, active: true },
              { label: "Listas", icon: <ListIcon /> },
              { label: "Histórico", icon: <ClockIcon /> },
              { label: "Perfil", icon: <UserIcon /> },
            ]}
          />
        </div>
      </section>

      <p className="font-[family-name:var(--font-num)] text-[11px] uppercase tracking-[0.08em] text-muted">
        troque o tema no botão do topo · claro / escuro
      </p>
    </main>
  );
}
