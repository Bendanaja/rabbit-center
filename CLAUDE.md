# rabbit-center

## Production Server
- **IP:** 45.144.167.90
- **SSH:** `ssh -i ~/.ssh/rabbit-center root@45.144.167.90`
- **SSH Key:** `~/.ssh/rabbit-center` (ed25519, comment: rabbit-center-prod)
- **Dokploy Dashboard:** http://45.144.167.90:3000
- **Dokploy Admin:** punyaweenaja@gmail.com
- **App ID:** qi7wNvxn-YCx-RqKtIMmI
- **Docker Service:** app-override-back-end-panel-a7bo7x
- **App Port:** 3000 (internal), 4000 (external)
- **Build:** Nixpacks
- **Domain:** rabbithub.ai

## Deploy Command
```bash
ssh -i ~/.ssh/rabbit-center root@45.144.167.90
```

## Dokploy API Deploy (from server)
```bash
COOKIE_JAR=/tmp/dokploy-cookies
curl -s -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"punyaweenaja@gmail.com","password":"<ask user>"}'
curl -s -b "$COOKIE_JAR" -X POST http://localhost:3000/api/trpc/application.deploy \
  -H "Content-Type: application/json" \
  -d '{"json":{"applicationId":"qi7wNvxn-YCx-RqKtIMmI"}}'
rm -f "$COOKIE_JAR"
```

## Tech Stack
- Next.js (App Router)
- Supabase (Auth + DB)
- Cloudflare R2 (Image storage)
- OpenRouter (AI model routing)
- Tailwind CSS + shadcn/ui

## R2 Folder Structure
```
rabbithub-images/
├── avatars/{userId}.{ext}
├── chats/{chatId}/attachments/{timestamp}-{i}.{ext}
└── chats/{chatId}/generated/{timestamp}-{i}.{ext}
```
