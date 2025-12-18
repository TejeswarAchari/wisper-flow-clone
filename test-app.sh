#!/bin/bash

echo "========================================="
echo "Wispr Flow - Automated Test Script"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check microphone
echo "📍 Test 1: Checking microphone device..."
if arecord -l 2>/dev/null | grep -q "card"; then
    echo -e "${GREEN}✅ Microphone device found${NC}"
else
    echo -e "${RED}❌ No microphone device found${NC}"
    echo "   Run: arecord -l"
    exit 1
fi

# Test 2: Check PulseAudio
echo ""
echo "📍 Test 2: Checking PulseAudio..."
if pulseaudio --check 2>/dev/null; then
    echo -e "${GREEN}✅ PulseAudio is running${NC}"
else
    echo -e "${YELLOW}⚠️  PulseAudio not running, trying to start...${NC}"
    pulseaudio --start 2>/dev/null
    sleep 1
    if pulseaudio --check 2>/dev/null; then
        echo -e "${GREEN}✅ PulseAudio started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start PulseAudio${NC}"
    fi
fi

# Test 3: Check internet
echo ""
echo "📍 Test 3: Checking internet connectivity..."
if ping -c 1 api.deepgram.com &>/dev/null; then
    echo -e "${GREEN}✅ Can reach Deepgram API${NC}"
else
    echo -e "${RED}❌ Cannot reach Deepgram API${NC}"
    echo "   Check your internet connection"
    exit 1
fi

# Test 4: Check API key
echo ""
echo "📍 Test 4: Validating Deepgram API key..."
API_KEY=$(grep VITE_DEEPGRAM_API_KEY .env 2>/dev/null | cut -d= -f2)
if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ API key not found in .env${NC}"
    exit 1
fi

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Token $API_KEY" \
  "https://api.deepgram.com/v1/projects")

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API key is valid${NC}"
else
    echo -e "${RED}❌ API key is invalid (HTTP $RESPONSE)${NC}"
    exit 1
fi

# Test 5: Check binary
echo ""
echo "📍 Test 5: Checking app binary..."
if [ -f "src-tauri/target/release/wispr-flow" ]; then
    SIZE=$(du -h src-tauri/target/release/wispr-flow | cut -f1)
    echo -e "${GREEN}✅ Binary exists ($SIZE)${NC}"
else
    echo -e "${RED}❌ Binary not found. Run: npm run tauri-build${NC}"
    exit 1
fi

# All tests passed
echo ""
echo "========================================="
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo "========================================="
echo ""
echo "Starting app..."
echo "1. Click 'Press & Hold to Record' button"
echo "2. Speak into your microphone"
echo "3. Release button to see transcription"
echo ""
echo "Press Ctrl+C to exit"
echo ""

./src-tauri/target/release/wispr-flow
