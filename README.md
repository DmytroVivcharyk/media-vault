# Media Vault

A modern media storage and management application built with Next.js 16 and MinIO object storage. Upload, view, and manage your media files with a clean, responsive interface.

## Features

- 🚀 **Modern Stack**: Built with Next.js 16, React 19, and TypeScript
- 📁 **File Upload**: Drag-and-drop file upload with progress tracking
- 🖼️ **Media Gallery**: Grid and list view with file selection and management
- 🗂️ **Object Storage**: MinIO S3-compatible storage with presigned URLs
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- ⚡ **Performance**: Direct uploads to storage with optimized loading

## Architecture

The project follows Feature-Sliced Design (FSD) architecture:

```
src/
├── app/                    # Next.js app router
├── entities/               # Business entities
│   └── media/             # Media entity (types, API)
├── features/              # Feature modules
│   ├── media-upload/      # Upload functionality
│   └── media-gallery/     # Gallery functionality
├── pages/                 # Page compositions
├── shared/                # Shared utilities and components
│   ├── lib/               # Utilities and configurations
│   └── ui/                # Reusable UI components
└── types/                 # Global type definitions
```

## Architecture Decision

**Upload Method Choice**: This application uses presigned URLs with `putObject` for direct-to-storage uploads instead of `createPresignedPost` for several key reasons:

- **Simplicity**: Presigned PUT URLs provide a straightforward upload mechanism with standard HTTP PUT requests, making client-side implementation cleaner and more predictable
- **Progress Tracking**: XMLHttpRequest with PUT allows for accurate upload progress monitoring, essential for user experience with large files
- **Security**: Each upload URL is generated server-side with a 1-hour expiration, ensuring controlled access without exposing storage credentials to the client
- **Performance**: Direct uploads bypass the application server, reducing bandwidth usage and eliminating the bottleneck of proxying large files
- **Scalability**: The server only handles lightweight URL generation requests, while MinIO handles the actual file storage, allowing the application to scale efficiently

The "Direct-to-Storage" security is maintained through temporary, scoped presigned URLs that grant write access only to specific object keys with time-limited validity.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/DmytroVivcharyk/media-vault.git
cd media-vault-project
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp example.env .env.local
```

The default configuration works with the included MinIO setup:

```env
# MinIO (S3-compatible)
AWS_ACCESS_KEY_ID=minio
AWS_SECRET_ACCESS_KEY=minio12345
AWS_REGION=us-east-1

AWS_S3_BUCKET=media-vault
AWS_S3_ENDPOINT=http://localhost:9000
```

### 3. Start MinIO Storage

Start the MinIO object storage service:

```bash
docker compose up -d
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Code Style

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Tailwind CSS** for styling

### State Management

The application uses React's `useReducer` for predictable state management:

- **UploadProvider**: Manages file upload state and progress
- **MediaGalleryProvider**: Handles media gallery state and interactions

Both providers follow the same reducer pattern for consistency.

## Project Structure Details

### Entities

- `entities/media/` - Core media types and API service

### Features

- `features/media-upload/` - File upload functionality with progress tracking
- `features/media-gallery/` - Media gallery with selection and management

### Shared

- `shared/lib/S3.ts` - AWS S3/MinIO client configuration
- `shared/ui/` - Reusable UI components (Button, ProgressBar)

## License

This project is licensed under the MIT License.
