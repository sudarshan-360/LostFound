#!/bin/bash

# Test script for API endpoints on EC2/Docker
# This script tests the API endpoints to ensure they work correctly

echo "Testing API endpoints..."

# Test basic connectivity
echo "1. Testing basic connectivity..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/lost
echo " - GET /api/lost"

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/found
echo " - GET /api/found"

# Test CORS headers
echo "2. Testing CORS headers..."
curl -s -I http://localhost:3000/api/lost | grep -i "access-control"
echo " - CORS headers for /api/lost"

curl -s -I http://localhost:3000/api/found | grep -i "access-control"
echo " - CORS headers for /api/found"

# Test external access via DuckDNS
echo "3. Testing external access via DuckDNS..."
curl -s -o /dev/null -w "%{http_code}" http://vitlostandfound.duckdns.org:3000/api/lost
echo " - GET http://vitlostandfound.duckdns.org:3000/api/lost"

curl -s -o /dev/null -w "%{http_code}" http://vitlostandfound.duckdns.org:3000/api/found
echo " - GET http://vitlostandfound.duckdns.org:3000/api/found"

# Test OPTIONS preflight request
echo "4. Testing OPTIONS preflight request..."
curl -s -X OPTIONS -H "Origin: http://vitlostandfound.duckdns.org:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -I http://localhost:3000/api/lost | grep -i "access-control"
echo " - OPTIONS preflight for /api/lost"

echo "API testing completed!"
