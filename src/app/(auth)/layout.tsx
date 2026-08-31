import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight text-ink"
          >
            Meu Mercado
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
