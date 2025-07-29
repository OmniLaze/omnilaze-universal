# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo app called "omnilaze-universal" with dual backend support: Python Flask for local development and Cloudflare Workers for production deployment. The app is a food ordering application with a multi-step authentication and form interface that collects user information and manages order creation with ratings and feedback.

Key feature: **Address Autocomplete** - Integrated with Amap (高德地图) API for real address search, with intelligent caching (5-minute cache, 70-85% API call reduction) and 4+ Chinese character input requirement.

## Architecture

### Frontend (React Native/Expo)
- **Main App**: `App.tsx` - Main application component with authentication flow and multi-step form
- **Authentication**: `src/components/AuthComponent.tsx` - Modular authentication component handling:
  - Phone number verification with SMS codes
  - New user detection and invite code validation
  - Dynamic question text updates with typewriter effect
- **Components**: Located in `src/components/` - Reusable UI components including:
  - `CurrentQuestion.tsx` - Displays current question with typewriter effect and avatar animations
  - `CompletedQuestion.tsx` - Shows completed answers with edit functionality
  - `BaseInput.tsx`, `BudgetInput.tsx` - Input components with validation
  - `MapComponent.tsx` - Map display for address confirmation
  - `ImageCheckbox.tsx` - Custom checkbox with images for preferences/allergies
- **Services**: `src/services/api.ts` - API layer with three main endpoints
- **Types**: `src/types/index.ts` - TypeScript interfaces for form data and authentication
- **Data**: `src/data/` - Static data for checkbox options and step content
- **Hooks**: Custom hooks for typewriter effect, validation, and complex animations
- **Styles**: Global styling with React Native StyleSheet and theme management

### Backend (Dual Architecture)
- **Development**: Python Flask server (`jwt/app.py`) with in-memory storage
- **Production**: Cloudflare Workers (`worker.js`) with D1 database and KV storage  
- **Database**: Supabase (Flask dev mode) / D1 database (Workers production)
- **Tables**: `users`, `invite_codes`, `orders` (see `migrations/001_initial.sql`)
- **Dependencies**: Flask (`jwt/requirements.txt`) / Workers (no external deps)

### Authentication Flow Architecture
The app uses a sophisticated 3-stage authentication system:
1. **Phone Verification**: SMS code sent and validated
2. **User Type Detection**: System determines if user is new or returning
3. **Invite Code Validation**: New users must provide valid invite code to register

## Development Commands

### Frontend (React Native/Expo)
```bash
# Start development server
npm run start

# Start on specific platforms
npm run android
npm run ios
npm run web

# Build for production (web)
npm run build

# Build for production with specific API URL
npm run build:production

# Install dependencies
npm install
```

### Backend - Flask Development Server
```bash
cd jwt

# Install dependencies (recommended with uv)
pip install -r requirements.txt

# Start API server (using provided script)
./start_api.sh

# Or manually start (runs on port 5001 to avoid macOS AirPlay conflicts)
python app.py
# or
uv run app.py

# Test API endpoints
python test_api.py
```

### Backend - Cloudflare Workers Production
```bash
# One-click deploy (creates D1 DB, KV namespace, deploys worker)
./deploy.sh

# Deploy frontend to Cloudflare Pages
./deploy-frontend.sh

# Manual deployment steps
wrangler d1 create omnilaze-orders
wrangler kv:namespace create VERIFICATION_KV
wrangler d1 execute omnilaze-orders --file=./migrations/001_initial.sql
wrangler deploy
```

### Database Setup
```bash
# Flask Development (Supabase)
psql -f jwt/supabase_setup.sql
# Or copy contents of jwt/supabase_setup.sql to Supabase dashboard

# Cloudflare Workers Production (D1)
wrangler d1 execute omnilaze-orders --file=./migrations/001_initial.sql
```

## Key Features

1. **Dual Backend Architecture**: Flask for local development, Cloudflare Workers for production
2. **Modular Authentication System**: Separate `AuthComponent` for reusable phone verification
3. **Complete Order Management**: Order creation, submission, rating and feedback system
4. **Dual-Mode Operation**: Development mode (in-memory) vs Production mode (D1/Supabase)
5. **Invite Code System**: New user registration requires valid invite codes
6. **Dynamic UI Updates**: Question text changes during authentication flow
7. **Multi-step Form Flow**: Authentication → Address → Allergies → Preferences → Budget → Order
8. **Interactive UI**: Typewriter effects, emoji animations, and smooth transitions
9. **Edit Mode**: Users can edit previously completed answers
10. **Map Integration**: Address confirmation with map display
11. **CORS Configuration**: Supports multiple development server ports
12. **Automated Deployment**: One-click deployment scripts for Cloudflare infrastructure

## Environment Setup

### Frontend
- Uses Expo SDK ~53.0.20
- React 19.0.0 with TypeScript
- React Native Maps for location features
- API connects to `http://localhost:5001` (Flask) or production Workers URL
- **Required Environment Variables**:
  - `REACT_APP_AMAP_KEY` - Amap (高德地图) API key for address autocomplete
  - `REACT_APP_API_URL` - Backend API URL (defaults to localhost:5001)

### Backend - Flask Development
- Requires `.env` file with:
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_KEY` - Your Supabase anon key
  - `SPUG_URL` - SMS service URL (optional)
  - `FORCE_DEV_MODE` - Set to "true" for development mode
- Flask server runs on `localhost:5001` (changed from 5000 due to macOS conflicts)
- Development mode uses in-memory storage with predefined invite codes: `1234`, `WELCOME`, `LANDE`, `OMNILAZE`, `ADVX2025`

### Backend - Cloudflare Workers Production
- Requires `wrangler.toml` configuration with:
  - `database_id` - D1 database identifier
  - `id` - KV namespace identifier for verification codes
- Environment variables:
  - `ENVIRONMENT` - Set to "production" or "development"
  - `ALLOWED_ORIGINS` - JSON array of allowed CORS origins
  - `SPUG_URL` - SMS service URL for production SMS sending
- Uses D1 database for persistent storage and KV for temporary verification codes

## State Management

### Main App State
- Authentication state: `isAuthenticated`, `authResult`, `authQuestionText`
- Form data: `address`, `budget`, `allergies`, `preferences`
- UI states: `currentStep`, `editingStep`, animation values

### AuthComponent State
- Phone verification: `phoneNumber`, `verificationCode`, `isVerificationCodeSent`
- User flow: `isPhoneVerified`, `isNewUser`, `inviteCode`
- UI feedback: `countdown`, `inputError`

## API Integration

The backend provides authentication and order management endpoints:

### Core Authentication APIs (Both Flask & Workers)
- `POST /send-verification-code` - Send SMS verification code
- `POST /login-with-phone` - Verify code and detect user type (returns `is_new_user` flag)
- `POST /verify-invite-code` - Validate invite code and create new user account

### Order Management APIs (Workers Only)
- `POST /create-order` - Create new order with user preferences
- `POST /submit-order` - Submit order for processing
- `POST /order-feedback` - Submit rating and feedback for completed order
- `GET /orders/{user_id}` - Get user's order history

### Health Check
- `GET /health` - Service health status and environment info

### Development vs Production Behavior
- **Development Mode**: Uses in-memory/Supabase storage, displays verification codes in console/response
- **Production Mode**: Uses D1 database, sends real SMS through configured service

The API base URL is configurable via `REACT_APP_API_URL` environment variable (defaults to `localhost:5001` for Flask, or Workers URL for production).

## Development Mode

The project supports a development mode that bypasses authentication for easier testing:

### Configuration
```typescript
// src/constants/index.ts
export const DEV_CONFIG = {
  SKIP_AUTH: true,  // Set to true to enable development mode
  MOCK_USER: {
    user_id: 'dev_user_123',
    phone_number: '13800138000',
    is_new_user: false,
  },
};
```

### Features
- **Auto Authentication**: App starts with authentication completed
- **Skip Verification**: No real phone number or verification code needed
- **Full Functionality**: All features work except real authentication flow

### Default Invite Codes (Development)
- `1234`, `WELCOME`, `LANDE`, `OMNILAZE`, `ADVX2025`

## Address Autocomplete Implementation

### Key Features
- **Amap API Integration**: Real address search using 高德地图 API
- **Input Validation**: Requires minimum 4 Chinese characters (using `/[\u4e00-\u9fff]/g`)
- **Smart Caching**: 5-minute cache system reduces API calls by 70-85%
- **Debouncing**: 500ms delay to prevent excessive API requests
- **Cross-platform**: Works on Web (Portal) and Native (dropdown)
- **Graceful Degradation**: API failures don't show mock data

### Usage
```tsx
import { AddressAutocomplete } from '../components/AddressAutocomplete';

<AddressAutocomplete
  value={address}
  onChangeText={handleAddressChange}
  onSelectAddress={handleSelectAddress}
  placeholder="请输入您的地址"
/>
```