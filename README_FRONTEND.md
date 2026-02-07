# IntelliNews Frontend

AI-powered newsletter platform frontend built with React, TypeScript, and Vite.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first styling
- **Lucide React** - Icon library
- **React Router** - Client-side routing

## Prerequisites

- Node.js 18+ and npm

## Environment Setup

Create a `.env` file in the `frontend` directory:

```bash
VITE_API_URL=http://localhost:8000
```

For production (Railway):
```bash
VITE_API_URL=https://your-backend-domain.railway.app
```

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server (runs on http://localhost:5173)
npm run dev
```

## Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (Dashboard, Discover, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React context providers
│   ├── utils/          # Utility functions
│   ├── constants.tsx   # App constants and configurations
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## Key Features

- **Onboarding Flow** - New user setup with source and topic selection
- **Article Discovery** - AI-powered article scraping and analysis
- **Semantic Search** - Vector-based article search
- **Newsletter Management** - Customizable email scheduling
- **Preferences** - Domain-aware topic and keyword suggestions
- **Analytics** - Reading progress and engagement tracking

## Domain-Aware Content

The app supports three content sources with specialized topics:

- **Academic** - Research papers, scientific publications
- **Industry** - Tech news, blog posts, company updates
- **Financial** - Market news, trading insights, economic analysis

Topics and keywords dynamically adapt based on selected source.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

See `/docs/deployment/` for Railway deployment guides.

## API Integration

The frontend communicates with the FastAPI backend via REST endpoints:

- Authentication: `/auth/login`, `/auth/register`
- Articles: `/articles/scrape`, `/articles/search`
- Preferences: `/preferences`, `/preferences/update`
- Newsletter: `/newsletter/schedule`, `/newsletter/send`

## Support

For deployment guides and setup instructions, check `/docs/`.
