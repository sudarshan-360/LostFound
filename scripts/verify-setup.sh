#!/bin/bash

# CLIP Matching System - Setup Verification Script

echo "🔍 Verifying CLIP Matching System Setup..."
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: .env.local exists
echo -n "1. Checking .env.local file... "
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   ${RED}ERROR: .env.local not found${NC}"
    exit 1
fi

# Check 2: BULLMQ_ENABLED setting
echo -n "2. Checking BULLMQ_ENABLED... "
if grep -q "BULLMQ_ENABLED=false" .env.local; then
    echo -e "${GREEN}✓ (disabled - direct matching)${NC}"
elif grep -q "BULLMQ_ENABLED=true" .env.local; then
    echo -e "${YELLOW}⚠ (enabled - requires Redis)${NC}"
    echo "   ${YELLOW}WARNING: Make sure Redis is running or set BULLMQ_ENABLED=false${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   ${RED}ERROR: BULLMQ_ENABLED not set in .env.local${NC}"
    exit 1
fi

# Check 3: SIMILARITY_THRESHOLD
echo -n "3. Checking SIMILARITY_THRESHOLD... "
if grep -q "SIMILARITY_THRESHOLD=0.75" .env.local; then
    echo -e "${GREEN}✓ (75%)${NC}"
elif grep -q "SIMILARITY_THRESHOLD" .env.local; then
    THRESHOLD=$(grep "SIMILARITY_THRESHOLD" .env.local | cut -d'=' -f2)
    echo -e "${YELLOW}⚠ (${THRESHOLD})${NC}"
else
    echo -e "${RED}✗ (not set)${NC}"
fi

# Check 4: CLIP_API_URL
echo -n "4. Checking CLIP_API_URL... "
if grep -q "CLIP_API_URL" .env.local; then
    CLIP_URL=$(grep "CLIP_API_URL" .env.local | cut -d'=' -f2)
    echo -e "${GREEN}✓ (${CLIP_URL})${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   ${RED}ERROR: CLIP_API_URL not set${NC}"
fi

# Check 5: MONGODB_URI
echo -n "5. Checking MONGODB_URI... "
if grep -q "MONGODB_URI" .env.local; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   ${RED}ERROR: MONGODB_URI not set${NC}"
fi

# Check 6: Email configuration
echo -n "6. Checking email config... "
if grep -q "SMTP_USER" .env.local && grep -q "SMTP_PASS" .env.local; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ (not fully configured)${NC}"
fi

echo ""
echo "7. Testing CLIP service..."
CLIP_URL=$(grep "CLIP_API_URL" .env.local | cut -d'=' -f2 || echo "http://localhost:8000")
if curl -s -f "${CLIP_URL}/health" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ CLIP service is running${NC}"
    CLIP_INFO=$(curl -s "${CLIP_URL}/health")
    echo "   $CLIP_INFO"
else
    echo -e "   ${RED}✗ CLIP service is NOT running${NC}"
    echo "   ${YELLOW}Start it with: npm run python:clip${NC}"
fi

echo ""
echo "8. Testing MongoDB connection..."
if node -e "require('dotenv').config({path:'.env.local'}); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => {console.log('✓ MongoDB connected'); process.exit(0);}).catch(e => {console.log('✗ MongoDB connection failed:', e.message); process.exit(1);});" 2>/dev/null; then
    echo -e "   ${GREEN}MongoDB connection successful${NC}"
else
    echo -e "   ${RED}MongoDB connection failed${NC}"
fi

echo ""
echo "=========================================="
echo "Summary:"
echo ""
echo -e "${GREEN}✓${NC} = OK"
echo -e "${YELLOW}⚠${NC} = Warning (may need attention)"
echo -e "${RED}✗${NC} = Error (must fix)"
echo ""
echo "Next steps:"
echo "1. Fix any ${RED}errors${NC} shown above"
echo "2. Start CLIP service: ${YELLOW}npm run python:clip${NC}"
echo "3. Start Next.js server: ${YELLOW}npm run dev${NC}"
echo "4. Test by adding items via the UI"
echo ""
echo "For detailed instructions, see: START_SYSTEM.md"
