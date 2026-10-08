import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // aceita conexões da rede local (celular)
    port: 5173,
    proxy: {
      // tudo que o front chamar em /api vai para o backend local
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
