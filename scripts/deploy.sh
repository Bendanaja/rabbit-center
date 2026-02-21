#!/bin/bash
set -e

SERVER="root@45.144.167.90"
SSH_KEY="$HOME/.ssh/rabbit-center"
APP_ID="qi7wNvxn-YCx-RqKtIMmI"
DOKPLOY_EMAIL="punyaweenaja@gmail.com"

echo "=== 1. Push to GitHub ==="
git push origin main

echo ""
echo "=== 2. Pull on server ==="
ssh -i "$SSH_KEY" "$SERVER" "cd /root/rabbit-center && git pull origin main"

echo ""
echo "=== 3. Build Docker image ==="
ssh -i "$SSH_KEY" "$SERVER" 'cd /root/rabbit-center && docker build --no-cache \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://api.rabbithub.ai \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJpc3MiOiAic3VwYWJhc2UiLCAicmVmIjogInJhYmJpdGh1YiIsICJyb2xlIjogImFub24iLCAiaWF0IjogMTc3MTA0MTEyNSwgImV4cCI6IDMwMzI0ODExMjV9.hNrhCSm4ARzg_9LEA9qHKsyEBFqZDyn1N_0wpnNU33Q \
  -t localhost:5000/rabbit-center:latest .'

echo ""
echo "=== 4. Push to registry ==="
ssh -i "$SSH_KEY" "$SERVER" "docker push localhost:5000/rabbit-center:latest"

echo ""
echo "=== 5. Deploy via Dokploy ==="
ssh -i "$SSH_KEY" "$SERVER" "bash -s" << 'DEPLOY'
COOKIE_JAR=/tmp/dokploy-cookies
read -s -p "Dokploy password: " PASS
echo
curl -s -c "$COOKIE_JAR" -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"'"$DOKPLOY_EMAIL"'\",\"password\":\"$PASS\"}" > /dev/null
curl -s -b "$COOKIE_JAR" -X POST http://localhost:3000/api/trpc/application.deploy \
  -H "Content-Type: application/json" \
  -d '{"json":{"applicationId":"'"$APP_ID"'"}}'
echo
rm -f "$COOKIE_JAR"
DEPLOY

echo ""
echo "=== Deploy complete! ==="
echo "Wait ~30s then check: https://rabbithub.ai"
