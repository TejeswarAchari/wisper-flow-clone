#!/bin/bash

echo "🏥 Wispr Flow - Health Check"
echo "=============================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js: $NODE_VERSION"
else
    echo "  ❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Check npm
echo ""
echo "✓ Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  ✅ npm: $NPM_VERSION"
else
    echo "  ❌ npm not found"
    exit 1
fi

# Check .env file
echo ""
echo "✓ Checking .env configuration..."
if [ -f .env ]; then
    if grep -q "VITE_DEEPGRAM_API_KEY" .env; then
        echo "  ✅ .env file found"
        API_KEY=$(grep "VITE_DEEPGRAM_API_KEY" .env | cut -d'=' -f2)
        if [ -z "$API_KEY" ]; then
            echo "  ⚠️  WARNING: VITE_DEEPGRAM_API_KEY is empty!"
            echo "      Add your key from https://console.deepgram.com"
        else
            echo "  ✅ VITE_DEEPGRAM_API_KEY configured"
        fi
    else
        echo "  ❌ VITE_DEEPGRAM_API_KEY not found in .env"
    fi
else
    echo "  ⚠️  .env file not found. Creating template..."
    cat > .env << 'ENVEOF'
VITE_DEEPGRAM_API_KEY=your_api_key_here
VITE_APP_NAME=Wispr Flow
VITE_API_TIMEOUT=30000
ENVEOF
    echo "  ✅ Template .env created. Edit with your API key!"
fi

# Check dependencies
echo ""
echo "✓ Checking Node dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules found"
else
    echo "  ⚠️  node_modules not found. Run: npm install"
fi

# Check package.json
echo ""
echo "✓ Checking package.json..."
if [ -f "package.json" ]; then
    echo "  ✅ package.json found"
else
    echo "  ❌ package.json not found"
fi

# Check src directory
echo ""
echo "✓ Checking source files..."
if [ -d "src" ]; then
    echo "  ✅ src/ directory found"
    if [ -f "src/main.tsx" ]; then
        echo "  ✅ main.tsx found"
    fi
    if [ -f "src/App.jsx" ]; then
        echo "  ✅ App.jsx found"
    fi
else
    echo "  ❌ src/ directory not found"
fi

# Check Tauri
echo ""
echo "✓ Checking Tauri setup..."
if [ -d "src-tauri" ]; then
    echo "  ✅ src-tauri/ directory found"
    if [ -f "src-tauri/tauri.conf.json" ]; then
        echo "  ✅ tauri.conf.json found"
    fi
else
    echo "  ❌ src-tauri/ directory not found"
fi

# Check Rust (optional)
echo ""
echo "✓ Checking Rust (for desktop builds)..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "  ✅ Rust: $RUST_VERSION"
else
    echo "  ℹ️  Rust not installed. Install from https://rustup.rs if building desktop app"
fi

# Summary
echo ""
echo "=============================="
echo "✅ Health Check Complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Deepgram API key"
echo "  2. Run: npm install"
echo "  3. Run: npm run dev (browser) or npm run tauri-dev (desktop)"
echo ""
echo "For more help, see QUICKSTART.md"
