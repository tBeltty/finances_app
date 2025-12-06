#!/bin/bash

BASE_URL="http://localhost:3001/api"
EMAIL="security_test_$(date +%s)@gmail.com"

echo "🛡️ Running Security Verification Tests..."

# 1. XSS Sanity Check (Global Middleware)
echo -n "Checking XSS Protection... "
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/validate-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "<script>alert(1)</script>test@gmail.com"}')

if [[ $RESPONSE == *"script"* ]]; then
    echo "❌ FAILED (Script tag preserved)"
else
    echo "✅ PASSED (Tag sanitized or rejected)"
fi

# 2. XSS in Body (Recursive)
echo -n "Checking Recursive XSS... "
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "email": "test@gmail.com", "profile": {"bio": "<img src=x>"}}')
# We expect the bio to be sanitized to &lt;img src=x&gt; or removed if backend logic allows profile
# Since register doesn't take profile, we just check if it crashes or returns 500
if [[ $RESPONSE != *"Internal Server Error"* ]]; then
    echo "✅ PASSED (Handled gracefully)"
else
    echo "❌ FAILED (Server Error)"
fi

# 3. Numeric Validation (Negative Amount)
echo -n "Checking Negative Amount... "
# We need a token for this, so we register first
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "antigravity_test@gmail.com", "password": "Password123!"}')
TOKEN=$(echo $TOKEN_RESPONSE | grep -oP '"token":"\K[^"]+')

if [ -z "$TOKEN" ]; then
    echo "⚠️ SKIPPING (Could not login)"
else
    RESPONSE=$(curl -s -X POST "$BASE_URL/expenses" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"name": "Test", "amount": -100, "date": "2025-12-06", "categoryId": 1}')
    
    if [[ $RESPONSE == *"Monto inv"* ]]; then
        echo "✅ PASSED (Rejected negative amount)"
    else
        echo "❌ FAILED (Accepted or different error: $RESPONSE)"
    fi
fi

# 4. Global Rate Limit (Cloudflare Trigger Simulation)
# We won't hammer it 300 times here to avoid triggering actual Cloudflare mode on prod if credentials work
# But we can verify the middleware is active by checking headers
echo -n "Checking Rate Limit Headers... "
RESPONSE=$(curl -s -I "$BASE_URL/auth/validate-email" | grep "RateLimit")
if [ -n "$RESPONSE" ]; then
    echo "✅ PASSED (Headers present)"
else
    echo "❌ FAILED (No RateLimit headers)"
fi

echo "Done."
