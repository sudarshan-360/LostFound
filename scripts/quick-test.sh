#!/bin/bash

# Quick API test for EC2 deployment
echo "=== LostFound API Quick Test ==="
echo ""

# Test 1: Basic API connectivity
echo "1. Testing API connectivity..."
echo "GET /api/lost:"
curl -s -w "Status: %{http_code}\n" http://localhost:3000/api/lost | head -5
echo ""

echo "GET /api/found:"
curl -s -w "Status: %{http_code}\n" http://localhost:3000/api/found | head -5
echo ""

# Test 2: CORS headers
echo "2. Testing CORS headers..."
echo "CORS headers for /api/lost:"
curl -s -I http://localhost:3000/api/lost | grep -i "access-control"
echo ""

# Test 3: External access (if DuckDNS is configured)
echo "3. Testing external access..."
echo "External GET /api/lost:"
curl -s -w "Status: %{http_code}\n" http://vitlostandfound.duckdns.org:3000/api/lost | head -3
echo ""

# Test 4: OPTIONS preflight
echo "4. Testing OPTIONS preflight..."
curl -s -X OPTIONS -H "Origin: http://vitlostandfound.duckdns.org:3000" \
  -H "Access-Control-Request-Method: GET" \
  -I http://localhost:3000/api/lost | grep -i "access-control"
echo ""

echo "=== Test Complete ==="
echo "If all tests show Status: 200, your API is working correctly!"
echo "If you see ERR_CONNECTION_REFUSED, check that Docker is running."
