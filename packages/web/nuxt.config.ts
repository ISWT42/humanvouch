// HumanVouch web — frontend shell (branding canvas).
// Dev server runs on a deliberately uncommon port to avoid the many
// services already bound on this machine.
export default defineNuxtConfig({
  compatibilityDate: "2026-06-28",
  modules: ["@nuxtjs/tailwindcss"],
  tailwindcss: {
    cssPath: "~/assets/css/main.css",
  },
  devServer: {
    port: 58273,
    host: "127.0.0.1",
  },
  app: {
    head: {
      title: "HumanVouch — proof a human stands behind this",
      htmlAttrs: { lang: "en" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Anonymous, sybil-resistant proof that a real, unique human vouches for a piece of content — verified on Stellar with zero-knowledge.",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
        },
      ],
    },
  },
});
