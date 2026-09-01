import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Resolve o alias "@/..." (igual ao tsconfig) para os testes poderem importar módulos do app.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
