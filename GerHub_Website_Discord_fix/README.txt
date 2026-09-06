GERHUB – Discord OAuth2 Fix

Warum der alte Link ERR_FILE_NOT_FOUND zeigte:
Die HTML-Datei verweist auf /auth/discord. Eine reine statische HTML-Datei hat dort keinen Server-Endpunkt. Dieses Paket enthält deshalb server.js, das den Discord-OAuth2-Login verarbeitet.

Start lokal:
1. Node.js installieren.
2. Im Ordner: npm install
3. .env.example nach .env kopieren und Werte eintragen.
4. npm start

Discord Developer Portal:
OAuth2 -> Redirects: exakt https://DEINE-DOMAIN.de/auth/discord/callback eintragen.
Scope: identify.

Wichtig:
- Niemals DISCORD_CLIENT_SECRET veröffentlichen oder in HTML/JavaScript einbauen.
- PayPal.me-Links reichen für einen einfachen Checkout, aber sie melden dem Server nicht zuverlässig, welcher Discord-User bezahlt hat. Für automatische Access-Vergabe brauchst du eine PayPal-Integration mit Bestell-ID/Webhook oder einen Zahlungsanbieter, der Webhooks unterstützt.
