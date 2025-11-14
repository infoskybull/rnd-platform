<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RnD Game Marketplace

A comprehensive game development marketplace platform where creators can showcase and sell their game projects, and publishers can discover and purchase game ideas, products, and collaboration opportunities.

## Features

### For Creators

- **Creator Dashboard**: View and manage all your created projects
- **Project Management**: Create, edit, publish, and delete game projects
- **Project Types**: Support for Idea Sales, Product Sales, and Development Collaboration
- **Analytics**: Track views, likes, and performance metrics
- **File Upload**: Upload and preview game prototypes

### For Publishers

- **Publisher Dashboard**: Browse and discover available game projects
- **Advanced Filtering**: Filter by project type, genre, platform, and more
- **Project Details**: View comprehensive project information and media
- **Purchase System**: Buy ideas and products, start collaborations
- **Search & Discovery**: Find projects that match your criteria

### Core Features

- **Authentication**: Secure login/signup with role-based access
- **Real-time Preview**: WebGL-powered game preview system
- **Responsive Design**: Modern, mobile-friendly interface
- **API Integration**: Full integration with backend game project APIs

## Project Types

1. **Idea Sale**: Creators create game concepts with descriptions and videos to sell to publishers
2. **Product Sale**: Creators upload complete prototype code/folders for sale
3. **Dev Collaboration**: Creators propose collaboration requests with budget and timeline

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env` file:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # PayPal Configuration (for payment integration)
   # Get your Sandbox Client ID from: https://developer.paypal.com/dashboard/applications/sandbox
   VITE_PAYPAL_CLIENT_ID_SANDBOX=your_sandbox_client_id_here
   
   # For production, get Live Client ID from: https://developer.paypal.com/dashboard/applications/live
   VITE_PAYPAL_CLIENT_ID_LIVE=your_live_client_id_here
   
   # PayPal Mode: "sandbox" for testing, "production" for live payments
   VITE_PAYPAL_MODE=sandbox
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## PayPal Sandbox Integration

The application includes PayPal payment integration with Sandbox mode for testing.

### Setup PayPal Sandbox

1. **Create a PayPal Developer Account**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Sign in or create an account

2. **Create a Sandbox App**
   - Navigate to [Apps & Credentials](https://developer.paypal.com/dashboard/applications/sandbox)
   - Click "Create App"
   - Select "Merchant" or "Personal" app type
   - Copy your **Sandbox Client ID**

3. **Configure Environment Variables**
   - Add `VITE_PAYPAL_CLIENT_ID_SANDBOX` to your `.env` file with your Sandbox Client ID
   - Set `VITE_PAYPAL_MODE=sandbox` for testing

4. **Test Payments**
   - Use test accounts from [PayPal Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
   - No real money will be charged in sandbox mode
   - A yellow banner will appear on the payment page indicating sandbox mode is active

### Production Setup

When ready for production:
1. Create a Live App in [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/live)
2. Copy your Live Client ID
3. Set `VITE_PAYPAL_CLIENT_ID_LIVE` in `.env`
4. Change `VITE_PAYPAL_MODE=production`

### Backend Integration

**⚠️ Lưu ý:** PayPal Secret (Client Secret) **KHÔNG được dùng ở Frontend**. Nó chỉ được dùng ở **Backend Server** để verify payments.

Nếu backend cần verify PayPal payments, xem hướng dẫn chi tiết trong file [PAYPAL_BACKEND_INTEGRATION.md](./PAYPAL_BACKEND_INTEGRATION.md).

**Tóm tắt:**
- Frontend chỉ cần `Client ID` (đã có)
- Backend cần `Client Secret` để verify payments với PayPal API
- Set PayPal Secret ở backend `.env` file, không phải frontend

## API Integration

The application integrates with a comprehensive backend API that supports:

- User authentication and role management
- Game project CRUD operations
- Advanced filtering and search
- Purchase and collaboration workflows
- Analytics and statistics

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Animation**: GSAP
- **File Processing**: JSZip
- **Preview**: WebGL/Three.js
- **Build Tool**: Vite
