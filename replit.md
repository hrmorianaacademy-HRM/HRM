# HRM Portal - Lead Management System

## Overview

The HRM Portal is a comprehensive lead management system designed for HR teams with role-based access control. The application supports multiple user roles (Manager, HR, Accounts, Admin) with distinct permissions and workflows. The system enables efficient lead tracking from initial contact through completion, with features like bulk Excel uploads, real-time analytics, audit trails, and automated role-based lead distribution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Charts**: Chart.js for data visualization and analytics dashboards

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based route protection
- **File Uploads**: Multer middleware for handling Excel file uploads
- **Excel Processing**: xlsx library for parsing and processing spreadsheet data
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL session store
- **Password Security**: bcrypt for password hashing
- **WebSocket Support**: WebSocket server for real-time features (notifications, live updates)

### Database Architecture
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migration System**: Drizzle Kit for database schema migrations
- **Connection Pooling**: Neon serverless connection pooling
- **Schema Design**: Normalized relational schema with proper foreign key constraints

### Key Data Models
- **Users**: Role-based user management with team hierarchy:
  - **Roles**: manager, team_lead, hr, accounts, admin, tech-support
  - **Team Fields**: `teamName` (for Team Leads), `teamLeadId` (for HR users)
- **Leads**: Complete lead lifecycle tracking with status progression
- **Lead History**: Comprehensive audit trail for all lead changes
- **Uploads**: File upload tracking and batch processing records
- **Sessions**: Secure session management for authentication
- **Chat Transcripts**: HR chatbot conversation history with user association

### Team Lead Hierarchy
- **Manager → Team Lead → HR Personnel** structure
- **Team Lead Role**:
  - Must have a team name (minimum 2 characters)
  - Can view team members assigned to them
  - Dashboard shows team members, lead counts, and activity metrics
  - Can filter leads by category
- **HR User Assignment**:
  - HR users can optionally be assigned to a Team Lead
  - Sidebar displays assigned Team Lead name and team
- **API Endpoints**:
  - `GET /api/my/team-lead`: HR users fetch their assigned Team Lead info
  - `GET /api/my/team-stats`: Team Leads fetch team members and aggregate stats

### Authentication & Authorization
- **Identity Provider**: Replit Auth with OIDC integration
- **Session Storage**: PostgreSQL-backed session store with configurable TTL
- **Role-Based Access Control**: Granular permissions based on user roles
- **Route Protection**: Middleware-based authentication checks on API endpoints
- **Frontend Guards**: React components with role-based rendering

### Lead Management Workflow
- **Manager Role**: Full system access, user management, bulk uploads, analytics, **Live Monitor (CCTV camera feed)**, **Chat History**
  - Uploads leads with hiring category selection (Client Hiring, Technical Hiring, Talent Acquisition Executive, Medical Coding)
  - Can view and delete HR chatbot conversation transcripts
- **HR Role**: Lead processing, status updates, scheduling, completion marking
  - **Category Selection Flow**: After login, HR users select their hiring category → dashboard filters all leads by selected category
  - All dashboard metrics (pie chart, my leads, completed leads) automatically filter by selected category
  - Access to AI-powered chatbot assistant for help with HR tasks
- **Accounts Role**: Financial processing of completed leads from HR
  - Leads filtered by selected category for consistency
- **Admin Role**: System administration and reporting capabilities
- **Tech Support Role**: Support team access similar to HR (assigned leads, completion tracking, personal lead dashboard)

### Category-Based Lead Filtering
- **Categories**: Client Hiring, Technical Hiring, Talent Acquisition Executive, Medical Coding
- **Manager Workflow**: During upload, manager selects category → all leads tagged with that category
- **HR Workflow**: At login, HR selects category → all views (unassigned, my leads, completed) filter by category
- **Implementation**: 
  - Category stored in `leads.category` column (database)
  - Category stored in `localStorage` under `selectedCategory` key
  - Dashboard listens to localStorage changes with useEffect event listener to update component state
  - All query keys include category parameter so React Query refetches with new category when it changes
  - All API endpoints (`/api/leads`, `/api/my/leads`, `/api/my/completed`) accept `category` query parameter
  - Backend `searchLeads()` function filters by category when provided
  - **Each category shows ONLY leads tagged with that exact category - no data mingles between categories**

### Monitoring & Surveillance - Live HLS Streaming
- **Live Monitor**: Manager-only feature for real-time CCTV camera HLS stream monitoring
- **Streaming Technology**: FFmpeg converts multicast UDP stream to HLS (HTTP Live Streaming)
- **Access**: Accessible only to users with "manager" role at `/live-monitor`
- **Camera Details**: IP `192.168.0.126` with TCP port `37777` (private network)
- **Default Multicast Source**: `udp://239.255.42.42:36666` (configurable)
- **Features**:
  - 📺 Live HLS video streaming with hls.js player
  - ⏯️ Start/Stop streaming controls
  - ⚙️ Configurable multicast stream URL
  - 🟢 Live status indicator
  - 📊 Stream configuration dashboard
- **Backend Implementation**: 
  - `server/streaming.ts`: HLS streamer service using FFmpeg
  - FFmpeg converts multicast UDP → HLS (.m3u8 playlists + .ts segments)
  - HLS segments stored in `/tmp/hls-segments` and served via `/hls/` endpoint
  - Segment duration: 2 seconds, max 5 segments (configurable)
- **Frontend Implementation**:
  - `client/src/pages/live-monitor.tsx`: React component with hls.js player
  - Start/Stop stream controls with real-time status
  - Multicast URL configuration and persistence
- **API Endpoints**:
  - `POST /api/hls/start`: Start HLS streaming from multicast source
  - `POST /api/hls/stop`: Stop HLS streaming
  - `GET /api/hls/status`: Check stream status and configuration
  - `GET /hls/*`: Serve HLS playlist and segment files
- **System Dependencies**: FFmpeg installed as system package

### File Processing System
- **Upload Strategy**: In-memory processing with Multer
- **Excel Parsing**: Support for multiple spreadsheet formats
- **Bulk Processing**: Batch lead creation with error handling and reporting
- **Allocation Strategies**: Multiple lead distribution methods (round-robin, manual assignment)

### Real-time Features
- **WebSocket Server**: Live notifications and updates
- **Query Invalidation**: Automatic UI updates when data changes
- **Optimistic Updates**: Immediate UI feedback for better user experience

## External Dependencies

### Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

### Authentication
- **Replit Auth**: OAuth 2.0/OIDC authentication provider
- **OpenID Client**: OIDC protocol implementation for secure authentication

### UI & Styling
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom theming
- **Lucide React**: Consistent icon library

### Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation

### Data & Charts
- **TanStack Query**: Server state management with caching
- **Chart.js**: Canvas-based charting library for analytics

### File Processing
- **Multer**: Multipart form data handling for file uploads
- **xlsx**: Excel file parsing and processing

### Video Streaming
- **FFmpeg**: Multicast UDP to HLS conversion with ultrafast encoding
- **hls.js**: Browser HLS player library for seamless video playback
- **HLS Protocol**: HTTP Live Streaming for adaptive bitrate video delivery

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety and better developer experience
- **Replit Plugins**: Development environment integration

## Implementation Details

### HLS Streaming Architecture
1. **Multicast Source** → FFmpeg captures UDP multicast stream
2. **Encoding** → FFmpeg encodes with libx264 (1000kbps video, 128kbps audio)
3. **HLS Segments** → 2-second segments stored as .ts files
4. **Playlist** → m3u8 playlist maintained with latest segments
5. **HTTP Serving** → Express serves /hls/ path with proper CORS headers
6. **Client Playback** → hls.js loads playlist and plays video in HTML5 video element

### How to Use Live Monitor with HLS Streaming
1. Log in as Manager
2. Go to Live Monitor from sidebar
3. Click "Settings" → Configure Multicast Stream URL (default: udp://239.255.42.42:36666)
4. Click "Start Stream" to begin capturing and converting to HLS
5. Video appears in the player once streaming is active
6. Use "Stop Stream" to end capture

### Troubleshooting HLS Streaming
- **No video appearing**: Verify multicast stream URL is correct and accessible from Replit servers
- **FFmpeg errors**: Check server logs for FFmpeg error messages
- **Stream won't start**: Ensure multicast stream is actively sending data
- **Segment files not updating**: Check /tmp/hls-segments directory permissions

### Network & Camera Configuration
**Important**: Replit servers cannot access private network IPs (192.168.x.x) directly.

**Your Camera Setup:**
- Camera IP: `192.168.0.126`
- Camera Port: `37777` (TCP)
- Stream likely at: `http://192.168.0.126:37777/` or `rtsp://192.168.0.126:37777/stream`

**To make it work, choose one option:**

1. **Option A: Port Forwarding (Recommended)**
   - Set up port forwarding on your router to expose the camera publicly
   - Forward external port to `192.168.0.126:37777`
   - Use the public URL (e.g., `http://public-ip:port/stream`)

2. **Option B: VPN/Tunnel**
   - Use ngrok, Cloudflare Tunnel, or similar to create a public URL for your camera
   - Point that public URL in Live Monitor settings

3. **Option C: Cloud Camera Service**
   - Use a cloud CCTV service (Axis, Hikvision Cloud, etc.)
   - Configure that service's streaming URL

**Testing Your Camera URL:**
1. Go to Live Monitor → Settings
2. Try URLs like:
   - `http://192.168.0.126:37777/stream` (won't work from Replit - private IP)
   - `http://192.168.0.126:37777/mjpeg`
   - `rtsp://192.168.0.126:37777/stream`
3. Check server logs for FFmpeg error messages to diagnose the issue
4. Once you have a public URL, use that instead