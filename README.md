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

2. Set up environment variables in `.env.local`:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

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
