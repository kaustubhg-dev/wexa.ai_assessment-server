#!/bin/bash
# test-endpoints.sh
# Smoke-tests every backend endpoint against the deterministic data from seed2.js.
# Run after: node scripts/seed.js --wipe && node scripts/seed2.js
#
# Usage: bash scripts/test-endpoints.sh [base_url]
# Default base_url: http://localhost:8080

BASE_URL="${1:-http://localhost:8080}"
PASS=0
FAIL=0

# checks that the response body is non-empty JSON with a non-empty "data" array/object
check() {
    local name="$1"
    local url="$2"
    local response
    response=$(curl -s "$url")

    if echo "$response" | grep -q '"data":\[\]' || echo "$response" | grep -q '"data":null'; then
        echo "❌ FAIL  $name — empty data"
        echo "   $url"
        FAIL=$((FAIL + 1))
    elif echo "$response" | grep -qi 'error\|<html'; then
        echo "❌ FAIL  $name — error response"
        echo "   $url"
        echo "   $response" | head -c 200
        echo ""
        FAIL=$((FAIL + 1))
    else
        echo "✅ PASS  $name"
        PASS=$((PASS + 1))
    fi
}

echo "Testing against $BASE_URL"
echo "-----------------------------------"

check "Health check"            "$BASE_URL/health"
check "List users"              "$BASE_URL/api/users"
check "List categories"         "$BASE_URL/api/categories"
check "User events (U101)"      "$BASE_URL/api/users/U101/events?days=50"
check "Viewed not purchased"    "$BASE_URL/api/users/U101/viewed-not-purchased"
check "Category affinity"       "$BASE_URL/api/users/U101/category-affinity"
check "Funnel (Laptops)"        "$BASE_URL/api/users/U101/funnel?viewedCategory=Laptops&purchasedCategory=Laptops&days=30"
check "Abandoned carts"         "$BASE_URL/api/carts/abandoned?minDays=7"
check "Recommendations (U101)"  "$BASE_URL/api/users/U101/recommendations?limit=5"
check "Explain (P102, U101)"    "$BASE_URL/api/recommendations/P102/explain?userId=U101"

echo "-----------------------------------"
echo "POST /ask (AI agent)"
ASK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "What did this user do in the last 50 days?", "userId": "U101"}')
if echo "$ASK_RESPONSE" | grep -q '"answer"'; then
    echo "✅ PASS  Ask AI"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL  Ask AI"
    echo "   $ASK_RESPONSE" | head -c 300
    FAIL=$((FAIL + 1))
fi

echo "-----------------------------------"
echo "Results: $PASS passed, $FAIL failed"