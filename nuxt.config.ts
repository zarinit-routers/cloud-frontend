// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
    devtools: { enabled: true },
    compatibilityDate: "2025-07-15",
    vite: {
        plugins: [tailwindcss()],
        server: {
            proxy: {
                "/api/": {
                    target: "http://79.174.70.81/",
                    changeOrigin: true,
                },
            },
        },
    },
    css: ["/main.css"],
    devServer: {
        port: 3001,
    },
});
