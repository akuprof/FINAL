# Overview

PLS Travels Fleet Management System is a comprehensive web application designed for managing fleet operations with role-based access control. The system supports three user roles: Admin, Manager, and Driver, each with tailored dashboards and functionalities. The application handles driver management, vehicle tracking, trip logging, automated payout calculations, and approval workflows.

Key features include:
- **Smart Payout Formula**: Automated calculations using `pay = min(revenue, 2250) * 0.30 + max(revenue - 2250, 0) * 0.70`
- **Role-based Dashboards**: Different interfaces for Admin, Manager, and Driver users
- **Mobile-first Design**: Optimized driver experience for smartphone usage
- **Trip Management**: Manual trip entry with revenue tracking and payout calculations
- **Approval Workflows**: Manager approval system for payouts and expenses

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based endpoint access
- **Session Management**: Express sessions with PostgreSQL storage
- **Middleware**: Custom logging, error handling, and authentication middleware

## Authentication & Authorization
- **Provider**: Replit Auth using OpenID Connect (OIDC)
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Role System**: Three-tier role system (admin, manager, driver) with hierarchical permissions
- **Security**: HTTP-only cookies, CSRF protection, and secure session management

## Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle migrations with TypeScript schema definitions
- **Key Entities**: Users, Drivers, Vehicles, Trips, Payouts, Assignments, Incidents, Documents
- **Data Relationships**: Foreign key constraints with proper relational design

## Application Structure
- **Monorepo Layout**: Shared schema between client and server in `/shared` directory
- **Client Structure**: Component-based architecture with UI components, pages, and hooks
- **Server Structure**: Route handlers, storage layer abstraction, and database operations
- **Type Safety**: Full TypeScript coverage with shared types between frontend and backend

## Business Logic Implementation
- **Payout Calculations**: Server-side formula implementation with real-time preview
- **Role-based Views**: Conditional rendering based on user roles and permissions
- **Mobile Responsiveness**: Separate navigation patterns for mobile and desktop users
- **Data Validation**: Zod schemas for runtime type checking and validation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migration management

## Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **Session Storage**: PostgreSQL-backed session persistence

## UI Components
- **Radix UI**: Unstyled, accessible component primitives
- **Shadcn/ui**: Pre-built component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design system

## Development Tools
- **Vite**: Fast build tool with React plugin and development server
- **TypeScript**: Static type checking across the entire application
- **ESBuild**: Production bundling for server-side code

## Runtime Libraries
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime schema validation
- **Date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight client-side routing