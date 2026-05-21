#!/usr/bin/env bash
# End-to-end verification for the deployed Airbnb Price Intelligence Platform.
#
# Run this once the Render backend is live:
#     bash backend/verify_deploy.sh [RENDER_API_URL]
#
# It tests all 4 API endpoints against the deployed backend, runs a real
# /predict end-to-end, and confirms all 4 live frontend pages load.

set -u

API="${1:-https://airbnb-price-api.onrender.com}"
SITE="https://airbnb-price-platform.vercel.app"
pass=0
fail=0

check() { # check "label" "actual" "expected-substring"
  if echo "$2" | grep -q "$3"; then
    echo "  PASS  $1"
    pass=$((pass + 1))
  else
    echo "  FAIL  $1"
    echo "        got: $2"
    fail=$((fail + 1))
  fi
}

echo "Backend : $API"
echo "Frontend: $SITE"
echo
echo "── API endpoints ───────────────────────────────────────"
# generous timeout — a free-tier instance may be cold-starting
check "GET  /health" "$(curl -s --max-time 120 "$API/health")" '"status":"ok"'
check "GET  /market-summary" "$(curl -s --max-time 60 "$API/market-summary")" 'neighborhoods'
check "GET  /feature-importance" "$(curl -s --max-time 60 "$API/feature-importance")" 'importance_pct'

echo
echo "── POST /predict — real listing end-to-end ─────────────"
PRED=$(curl -s --max-time 60 -X POST "$API/predict" \
  -H 'Content-Type: application/json' \
  -d '{"neighborhood":"Williamsburg","roomType":"entire","propertyType":"apartment","bedrooms":1,"bathrooms":1,"accommodates":2,"amenities":["wifi","kitchen","ac"],"numReviews":24,"reviewScore":95,"description":"Bright renovated apartment near the subway."}')
check "POST /predict returns a price" "$PRED" 'predicted_price'
check "POST /predict returns drivers" "$PRED" 'price_drivers'
echo "        → $PRED"

echo
echo "── Frontend pages ──────────────────────────────────────"
for r in / /predict/ /dashboard/ /methodology/; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE$r")
  check "GET  $r" "$code" "200"
done

echo
echo "────────────────────────────────────────────────────────"
echo "  $pass passed · $fail failed"
if [ "$fail" -eq 0 ]; then
  echo "  ✅ END-TO-END VERIFICATION PASSED"
else
  echo "  ❌ see failures above"
fi
exit "$fail"
