import type { MetadataRoute } from "next";

// Web App Manifest — torna o app instalável (RF6). Estático/cacheável (sem API em request-time).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meu Mercado",
    short_name: "Mercado",
    description: "Sua lista de mercado — rápida, organizada por corredor e com controle de gasto.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#fbfbf9",
    theme_color: "#17794c",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
