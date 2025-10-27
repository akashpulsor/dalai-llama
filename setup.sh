#!/bin/bash

# ============================================
# Dalai Llama Web - Quick Setup Script
# ============================================

echo "🦙 Welcome to Dalai Llama Web Setup!"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create Vite React Project
echo -e "${BLUE}📦 Step 1: Creating React project with Vite...${NC}"
npm create vite@latest dalai-llama-web -- --template react
cd dalai-llama-web

echo -e "${GREEN}✓ Project created!${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
npm install

echo -e "${BLUE}📦 Installing additional packages...${NC}"
npm install react-router-dom lucide-react axios @reduxjs/toolkit react-redux

echo -e "${BLUE}📦 Installing dev dependencies...${NC}"
npm install -D tailwindcss postcss autoprefixer

echo -e "${GREEN}✓ All dependencies installed!${NC}"
echo ""

# Step 3: Initialize Tailwind
echo -e "${BLUE}🎨 Step 3: Setting up Tailwind CSS...${NC}"
npx tailwindcss init -p

echo -e "${GREEN}✓ Tailwind initialized!${NC}"
echo ""

# Step 4: Create folder structure
echo -e "${BLUE}📁 Step 4: Creating folder structure...${NC}"
mkdir -p src/assets/images
mkdir -p src/assets/audio
mkdir -p src/components
mkdir -p src/screens
mkdir -p src/services
mkdir -p src/utils

echo -e "${GREEN}✓ Folders created!${NC}"
echo ""

# Step 5: Create utility files
echo -e "${BLUE}📝 Step 5: Creating utility files...${NC}"

# Create validators.js
cat > src/utils/validators.js << 'EOF'
export const emailValidator = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

export const passwordValidator = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export const nameValidator = (name) => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  return '';
};
EOF

# Create api.js
cat > src/services/api.js << 'EOF'
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-url.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

export default api;
EOF

echo -e "${GREEN}✓ Utility files created!${NC}"
echo ""

# Step 6: Update tailwind.config.js
echo -e "${BLUE}🎨 Step 6: Configuring Tailwind...${NC}"
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
EOF

echo -e "${GREEN}✓ Tailwind configured!${NC}"
echo ""

# Step 7: Update index.css
echo -e "${BLUE}🎨 Step 7: Updating CSS...${NC}"
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}
EOF

echo -e "${GREEN}✓ CSS updated!${NC}"
echo ""

# Step 8: Update App.jsx
echo -e "${BLUE}📝 Step 8: Setting up routing...${NC}"
cat > src/App.jsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './screens/LandingPage';
import HomePage from './screens/HomePage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
EOF

echo -e "${GREEN}✓ Routing configured!${NC}"
echo ""

# Step 9: Create .env file
echo -e "${BLUE}🔐 Step 9: Creating environment file...${NC}"
cat > .env << 'EOF'
VITE_API_URL=https://your-api-url.com/api
VITE_GA_ID=your-google-analytics-id
EOF

echo -e "${GREEN}✓ Environment file created!${NC}"
echo ""

# Step 10: Create README
echo -e "${BLUE}📖 Step 10: Creating README...${NC}"
cat > README.md << 'EOF'
# Dalai Llama Web

AI Outbound Calling Platform - Web Application

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── assets/          # Images and audio files
├── components/      # Reusable components
├── screens/         # Page components
├── services/        # API services
├── utils/           # Helper functions
└── App.jsx          # Main app with routing
```

## Technologies

- React 18
- Vite
- React Router
- Tailwind CSS
- Lucide React (Icons)
- Axios

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

EOF

echo -e "${GREEN}✓ README created!${NC}"
echo ""

# Final message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ Setup Complete! ✨${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Copy your screen components:"
echo "   cp path/to/HomePage.jsx src/screens/"
echo "   cp path/to/LandingPage.jsx src/screens/"
echo ""
echo "2. Copy your assets:"
echo "   cp path/to/assets/*.png src/assets/images/"
echo "   cp path/to/assets/*.mp3 src/assets/audio/"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Open your browser:"
echo "   http://localhost:5173"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
echo ""