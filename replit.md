# Discord Scheduler Bot - Replit Project Guide

## Overview

This is a full-stack Discord bot application for scheduling and managing automated message notifications in Discord servers. The application provides a web dashboard for users to authenticate with Discord, create scheduled messages, and manage their bot notifications across multiple servers and channels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom Discord-themed color palette
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API**: RESTful API endpoints for authentication, servers, channels, and notifications
- **Development**: Hot module reloading with Vite integration

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Shared schema definitions between client and server
- **Development**: In-memory storage implementation for development/testing
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Authentication System
- **Discord OAuth**: Integration with Discord's OAuth2 for user authentication
- **Session Management**: PostgreSQL session storage with connect-pg-simple
- **Development Mode**: Mock authentication for development environment

### Discord Integration
- **Bot Framework**: Discord.js v14 for Discord API interactions
- **Server Management**: Automatic discovery and management of Discord servers
- **Channel Management**: Dynamic channel fetching and caching

### Notification System
- **Scheduling**: Advanced scheduling with repeat patterns (once, daily, weekly, monthly, working_days)
- **Timezone Support**: Full timezone handling for accurate scheduling
- **Message Features**: Support for mentions, embeds, and rich formatting
- **Logging**: Comprehensive notification delivery tracking

### User Interface
- **Dashboard**: Main interface showing statistics and recent notifications
- **Notification Creator**: Form-based notification creation with validation
- **Server Browser**: Interface for managing connected Discord servers
- **Real-time Updates**: Live updates using React Query

## Data Flow

1. **User Authentication**: Users authenticate via Discord OAuth, creating/updating user records
2. **Server Discovery**: Bot automatically discovers user's Discord servers and channels
3. **Notification Creation**: Users create notifications through the web interface
4. **Scheduling**: Backend processes schedule notifications based on timezone and repeat patterns
5. **Message Delivery**: Bot sends messages to specified Discord channels at scheduled times
6. **Logging & Analytics**: All actions are logged for analytics and debugging

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **discord.js**: Discord API client library
- **drizzle-orm**: TypeScript-first ORM for PostgreSQL
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Comprehensive UI component library

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Authentication & Sessions
- **connect-pg-simple**: PostgreSQL session store for Express
- **zod**: Schema validation for API endpoints

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable
- **Discord**: Bot token and OAuth credentials for Discord integration
- **Sessions**: Secure session configuration for production

### Production Setup
- **Static Assets**: Frontend served from Express static middleware
- **API Routes**: Express handles all `/api/*` routes
- **Database**: Production PostgreSQL database (Neon or similar)
- **Process Management**: Single Node.js process handles both frontend and backend

### Development Features
- **Hot Reloading**: Vite middleware integrated with Express for development
- **Mock Data**: In-memory storage for development without database setup
- **Error Handling**: Runtime error overlay for development debugging

### Message Forwarder System
- **Purpose**: Monitor specific Discord channels for keyword triggers and forward matching messages
- **Database Schema**: forwarders table with source/destination channels, keywords, match type
- **Logging**: forwarderLogs table tracks all forwarded messages with status
- **Keyword Matching**: Case-insensitive matching with two modes:
  - **Contains**: Keyword appears anywhere in message
  - **Exact**: Keyword appears as distinct word (with punctuation normalization)
- **Bot Message Filtering**: Automatically ignores messages from bots (including self)
- **Thread Support**: Can monitor and forward to specific Discord threads
- **Cache System**: In-memory cache using channel:discordId and thread:threadId keys
- **Validation**: Backend validates server connectivity and channel ownership

## Recent Changes: Latest modifications with dates

### December 20, 2025 - Message Forwarder Module
- **Forwarder Schema**: Added forwarders and forwarderLogs tables with full relations
- **Storage CRUD**: Implemented getForwarders, createForwarder, updateForwarder, deleteForwarder
- **API Endpoints**: Full REST API at /api/forwarders/* with authentication and ownership checks
- **Discord Bot Handler**: messageCreate event with keyword matching, bot filtering, and message forwarding
- **Forwarders UI**: Management page with list view, create/edit dialog, toggle, and delete
- **Backend Validation**: Server connectivity and channel ownership verification
- **Cache Management**: Automatic cache reload on forwarder create/update/delete/toggle

### January 30, 2025 - Discord Bot Application Completed
- **Complete Multi-Page Application**: Implemented all navigation pages with full functionality
- **Dashboard**: Main interface with statistics cards, recent notifications, and server status
- **Create Notification**: Full-featured form with server/channel selection, scheduling, and repeat options
- **Notifications List**: Complete CRUD interface with filtering, search, and management features
- **Servers Management**: Server overview with channel listings and connection status
- **Analytics**: Performance metrics, notification type breakdowns, and activity tracking
- **Settings**: Configuration interface with tabbed navigation for bot settings
- **Sidebar Navigation**: Fully functional routing between all pages using Wouter
- **TypeScript Integration**: Strongly typed components with shared schema validation
- **Discord Branding**: Custom color scheme and Discord-themed UI components