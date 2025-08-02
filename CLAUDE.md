# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo app called "omnilaze-universal" (懒得点外卖) with dual backend support: Python Flask for local development and Cloudflare Workers for production deployment. The app is a food ordering application with a multi-step authentication and form interface that collects user information and manages order creation with ratings and feedback.

Key feature: **Address Autocomplete** - Integrated with Amap (高德地图) API for real address search, with intelligent caching (5-minute cache, 70-85% API call reduction) and 4+ Chinese character input requirement.

**Critical Architecture Note**: This project uses a unique dual-backend architecture where the Flask server is primarily for local development/testing, while Cloudflare Workers handles production traffic. The frontend automatically detects and adapts to both environments.

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
wrangler d1 execute omnilaze-orders --file=./migrations/001_initial.sql --remote
wrangler d1 execute omnilaze-orders --file=./migrations/007_user_preferences.sql --remote
wrangler deploy

# Monitor deployment
wrangler tail
```

### Database Setup
```bash
# Flask Development (Supabase)
psql -f jwt/supabase_setup.sql
# Or copy contents of jwt/supabase_setup.sql to Supabase dashboard

# Cloudflare Workers Production (D1)
wrangler d1 execute omnilaze-orders --file=./migrations/001_initial.sql
```

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
- **Services**: `src/services/api.ts` - API layer with authentication and order management endpoints
- **Types**: `src/types/index.ts` - TypeScript interfaces for form data and authentication
- **Data**: `src/data/` - Static data for checkbox options and step content
- **Hooks**: Custom hooks for typewriter effect, validation, and complex animations
- **Styles**: Global styling with React Native StyleSheet and theme management

### Critical State Management Architecture

The app uses a sophisticated hook-based state management system with several key patterns:

#### Unified State Management (`src/hooks/useAppState.ts`)
Centralizes all application state including:
- Authentication state (isAuthenticated, authResult, authQuestionText)
- Form data (address, budget, allergies, preferences, selectedFoodType)
- UI control state (currentStep, editingStep, completedAnswers)
- Order management state (currentOrderId, isOrderSubmitting, isOrderCompleted)
- Free order system state (isFreeOrder, showFreeDrinkModal)

#### Unified Question & Answer Management (`App.tsx`)
- **`handleQuestionTransition()`**: Manages all question display transitions with typewriter effects
- **`handleAnswerSubmission()`**: Standardized answer processing with validation and animations
- **`handleStepProgression()`**: Controls step advancement with special logic for drink vs food selections

#### Form Steps Hook (`src/hooks/useFormSteps.ts`)
Complex form flow management that handles:
- Dynamic step content based on previous selections (food vs drink affects later steps)
- Edit mode for completed answers with state restoration
- Special handling for free order flow (auto-progression, limited options)
- Cross-step dependencies (selecting drink skips allergy/preference steps)

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

## Key Features & Implementation Details

### Critical Animation & Timing System
The app uses React Native Animated API with carefully coordinated timing to avoid conflicts:
- **Zero Animation Delays**: `TIMING.ANIMATION_DELAY = 0` to prevent timing conflicts
- **Immediate Transitions**: Typewriter effects and input animations happen synchronously
- **Unified Management**: All animations coordinated through central handlers to prevent flashing

### Free Order System Architecture
Special mode that changes the entire app flow:
- **Auto-selection**: Food type automatically set to 'drink'
- **Modified Questions**: Different question text throughout flow
- **Shortened Flow**: Skips allergy/preference steps
- **Quota Management**: Integration with invite system for eligibility checking

### Address Autocomplete System (`src/components/AddressAutocomplete.tsx`)
- **API Integration**: Amap (高德地图) with intelligent caching
- **Performance**: 5-minute cache reduces API calls by 70-85%
- **Input Validation**: Minimum 4 Chinese characters required using `/[\u4e00-\u9fff]/g`
- **Cross-platform**: Different rendering for Web vs Native

### Invite & Free Drink System (`src/components/InviteModalWithFreeDrink.tsx`)
Complex gamification system with:
- **Progress Tracking**: Visual progress bars for invite milestones
- **Animated Rewards**: Sophisticated animation sequences for free drink offers
- **Quota Management**: Global free drink limits with real-time checking
- **API Integration**: Multiple endpoints for stats, progress, and claiming

### Quick Order System Architecture
Advanced user experience optimization for returning users:
- **Preference Detection**: System checks if user has complete preferences via `/preferences-completeness/{user_id}`
- **Auto-fill Flow**: If preferences exist, automatically fills all form fields and skips to payment
- **Streamlined UX**: Quick order mode bypasses confirmation cards and goes directly to order submission
- **Fallback Handling**: New users or users without complete preferences follow normal flow
- **Implementation**: Located in `handleAuthSuccess()` in `App.tsx:347-425`

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

### Invite System APIs
- `GET /user-invite-stats/{user_id}` - Get user's invite statistics and eligibility
- `GET /invite-progress/{user_id}` - Get detailed invite progress and history
- `GET /free-drinks-remaining` - Get global free drink quota
- `POST /claim-free-drink` - Claim free drink reward

### Health Check
- `GET /health` - Service health status and environment info

### Development vs Production Behavior
- **Development Mode**: Uses in-memory/Supabase storage, displays verification codes in console/response
- **Production Mode**: Uses D1 database, sends real SMS through configured service

The API base URL is configurable via `REACT_APP_API_URL` environment variable (defaults to `localhost:5001` for Flask, or Workers URL for production).

### Current Production Deployment
- **Frontend**: https://4f47009e.omnilaze-universal-frontend.pages.dev (Cloudflare Pages)
- **Backend**: https://omnilaze-universal-api.stevenxxzg.workers.dev (Cloudflare Workers)
- **Database**: D1 database with ID `37fb6011-73ef-49f9-a189-312c69a098db`
- **KV Storage**: Verification codes with namespace ID `9c43c4f6c5d348afb5ff54b7784d9ba1`

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

### Preferences System APIs
- `POST /preferences` - Save user preferences (address, food type, allergies, preferences, budget)
- `GET /preferences/{user_id}` - Get user preferences
- `PUT /preferences/{user_id}` - Update user preferences  
- `DELETE /preferences/{user_id}` - Delete user preferences
- `GET /preferences-completeness/{user_id}` - Check if user has complete preferences for quick ordering

### Data Translation System
The app includes a sophisticated English-to-Chinese translation system for UI display:
- **VALUE_MAPPING**: Maps internal English values ('seafood', 'meal') to Chinese display ('海鲜类', '吃饭')
- **convertToChineseDisplay()**: Function that handles both single values and arrays for consistent Chinese output  
- **Implementation**: Used in `formatAnswerDisplay()` to ensure all user answers display in Chinese
- **Location**: `src/data/checkboxOptions.ts:85-126` for mapping definitions and conversion logic

### Critical UI/UX Fixes Implemented
Recent improvements to address user experience issues:

#### Answer Display Language Fix
- **Issue**: Completed answers were displaying in English ('seafood', 'meal') instead of Chinese
- **Solution**: Implemented VALUE_MAPPING and convertToChineseDisplay() in `src/data/checkboxOptions.ts`
- **Result**: All answers now display properly in Chinese ('海鲜类', '吃饭')

#### Question-Answer Alignment Fix  
- **Issue**: Question-answer mismatch due to phone number question handling
- **Solution**: Special index handling for phone question (-1) in `App.tsx:552-555`
- **Result**: Proper alignment between questions and answers throughout flow

#### Quick Order Flow Optimization
- **Issue**: Users wanted to skip confirmation card and go directly to payment
- **Solution**: Removed QuickOrderSummary component usage, direct execution of handleConfirmOrder()
- **Implementation**: `App.tsx:405-407` with 1-second delay for user feedback
- **Result**: Streamlined quick order experience

#### Persistent Order Completion Message
- **Issue**: Order completion message disappeared on page refresh
- **Solution**: Added `orderMessage` state to `useAppState.ts` with Cookie persistence
- **Implementation**: Message persists through `CookieManager.saveConversationState()`
- **Result**: "我去下单，记得保持手机畅通，不要错过外卖员电话哦" message survives refresh

## Database Migrations

The project uses incremental SQL migrations for database schema management:
- **001_initial.sql**: Core tables (users, invite_codes, orders)
- **002_invite_system.sql**: Invite system enhancements 
- **003-006**: User sequence and free drink system
- **007_user_preferences.sql**: User preferences table for quick ordering

Migration execution:
```bash
# Apply specific migration
wrangler d1 execute omnilaze-orders --file=./migrations/007_user_preferences.sql --remote

# Run all migrations via deploy script
./deploy.sh
```

## Critical Development Patterns

### State Management Debugging
When working with this codebase, be aware of these critical patterns:

#### Array vs String Value Handling
The app handles values that can be either arrays or strings. **Always use this pattern when processing answer values**:
```typescript
// In handleEditAnswer and handleCancelEditing functions
const labels = Array.isArray(answerValue) 
  ? answerValue 
  : answerValue.split(', ');
```

#### Animation Timing Management
**CRITICAL**: Animation conflicts have been eliminated by setting `TIMING.ANIMATION_DELAY = 0`. All transitions are immediate to prevent UI flashing.

#### Quick Order Mode Requirements
- Set `isQuickOrderMode = true` when activating quick order
- Use `convertToChineseDisplay()` for all completed answers
- Force question text update with `setTimeout(() => handleQuestionTransition(...), 100)`

### Common Bug Patterns to Avoid

#### 1. Split Method Errors
**Problem**: Calling `.split()` on array values from quick order mode
**Solution**: Always check `Array.isArray()` before calling `.split()`

#### 2. Question Text Caching
**Problem**: Stale question text in quick order mode
**Solution**: Force update with `handleQuestionTransition()` after state changes

#### 3. React Native Web Style Issues
**Problem**: Invalid CSS properties causing warnings
**Solution**: Use platform-specific styles:
```typescript
...(Platform.OS === 'web' && {
  outlineStyle: 'none',
  textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
})
```

## Testing and Development

### Running Tests
Currently no automated tests are configured. Manual testing through:
- `python jwt/test_api.py` for backend API testing
- Manual UI testing through the development server

### Linting and Type Checking
This project uses TypeScript for type safety. While no specific lint/typecheck commands are configured in package.json, ensure your IDE has TypeScript checking enabled.

### Common Development Tasks
- **Address Component Testing**: Use dev mode with `DEV_CONFIG.SKIP_AUTH = true`
- **API Testing**: Use Flask dev server with in-memory storage
- **Production Testing**: Deploy to Cloudflare Workers staging environment
- **Database Testing**: Use `wrangler d1` commands to inspect D1 database
- **Real-time Monitoring**: Use `wrangler tail` for production debugging

### Debugging
- **Frontend Logs**: Check browser console or React Native debugger
- **Flask Backend**: Check terminal output where Flask server is running
- **Workers**: Use `wrangler tail` for real-time logging
- **Environment Issues**: Check `.env` file and environment variable configuration
- **Animation Issues**: All timing conflicts have been eliminated - animations should be smooth without flashing
- **Database Issues**: Use `wrangler d1 execute omnilaze-orders --command="SELECT * FROM table_name" --remote` to inspect data

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