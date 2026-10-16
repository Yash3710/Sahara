import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: { port: 5173, open: true },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        companion: resolve(__dirname, 'companion.html'),
        navigation: resolve(__dirname, 'navigation.html'),
        sos: resolve(__dirname, 'sos.html'),
        reminders: resolve(__dirname, 'reminders.html'),
        vault: resolve(__dirname, 'vault.html'),
        profile: resolve(__dirname, 'profile.html'),
        forgotPassword: resolve(__dirname, 'forgot-password.html')
      }
    }
  }
});
