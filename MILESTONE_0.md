# Milestone 0: SB Lead Intel - Project Foundation

## Overview

SB Lead Intel is a Next.js 14 application that provides sales intelligence for lead qualification and research. The project is built with TypeScript, Tailwind CSS, and integrates with Supabase, Slack, Anthropic, and Tavily APIs.

## Project Structure

```
sb-lead-intel/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts          # Health check endpoint
│   │   │   ├── slack/route.ts           # Slack event receiver
│   │   │   └── process/route.ts         # Lead processing pipeline
│   │   ├── lead/[id]/page.tsx           # Lead report page (M6)
│   │   ├── layout.tsx                   # Root layout with metadata
│   │   ├── page.tsx                     # Dashboard placeholder
│   │   └── globals.css                  # Global styles import
│   ├── lib/
│   │   ├── supabase.ts                  # Supabase client & types
│   │   ├── slack.ts                     # Slack integration
│   │   ├── anthropic.ts                 # Claude API wrapper
│   │   ├── research.ts                  # Tavily research orchestrator
│   │   ├── validator.ts                 # Lead validation logic
│   │   └── report-builder.ts            # Report generation
│   ├── components/
│   │   ├── Navbar.tsx                   # Navigation bar
│   │   ├── StatusBadge.tsx              # Status indicator
│   │   ├── LeadCard.tsx                 # Lead summary card
│   │   ├── CompanyHeader.tsx            # Company info header
│   │   ├── ReportView.tsx               # Report display
│   │   ├── RobotRecommendation.tsx      # Product recommendation
│   │   ├── OpportunityList.tsx          # Opportunity list
│   │   └── TalkingPoints.tsx            # Sales talking points
│   └── styles/
│       └── globals.css                  # Standard Bots theme
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql       # Database schema
├── tailwind.config.ts                   # Tailwind configuration
├── tsconfig.json                        # TypeScript config
├── next.config.mjs                      # Next.js config
├── .env.example                         # Environment variables template
└── package.json                         # Dependencies

```

## Implemented Features

### 1. **Supabase Integration** (`src/lib/supabase.ts`)
- Browser client for public operations
- Admin client for server-side operations
- TypeScript interfaces for Lead, Report, and ResearchSource
- Helper functions for CRUD operations

### 2. **Slack Integration** (`src/lib/slack.ts`)
- Slack Bolt app with Socket Mode configuration
- HubSpot-format message parser
- Extracts structured lead data from Slack messages
- Message validation

### 3. **Anthropic Claude Integration** (`src/lib/anthropic.ts`)
- Claude API wrapper using claude-sonnet-4-5-20250929
- Helper functions for:
  - Basic Claude calls
  - Structured analysis
  - JSON generation

### 4. **Research Orchestrator** (`src/lib/research.ts`)
- Tavily API integration for web research
- Company information search
- News article retrieval
- Company logo fetching
- Full research pipeline

### 5. **Lead Validator** (`src/lib/validator.ts`)
- Basic email and domain validation
- Lead quality assessment
- Semantic validation using Claude
- Scoring system (0-100)

### 6. **Report Generator** (`src/lib/report-builder.ts`)
- Comprehensive report generation
- Company analysis
- Robot/product recommendations
- Sales talking points generation
- Opportunity identification
- Risk assessment
- Overall scoring

### 7. **API Endpoints**

#### Health Check (`src/app/api/health/route.ts`)
- GET endpoint returning status and timestamp
- Used for service monitoring

#### Slack Receiver (`src/app/api/slack/route.ts`)
- POST endpoint for Slack events
- Signature verification
- Lead creation from Slack messages

#### Lead Processing (`src/app/api/process/route.ts`)
- POST endpoint for processing leads
- Three-stage pipeline:
  1. Validation
  2. Research
  3. Report generation
- Support for GET with query parameters

### 8. **Database Schema** (`supabase/migrations/001_initial_schema.sql`)

**Leads Table**
- Core lead information from HubSpot
- Status tracking (pending, validating, researching, complete, invalid)
- Validation results
- Raw Slack message storage

**Reports Table**
- Comprehensive company and analysis data
- Research findings
- Recommendations
- Sales intelligence
- Related to leads via foreign key

**Research Sources Table**
- Individual research sources
- Tracks type, content, and retrieval time
- Related to reports

### 9. **Styling** (`src/styles/globals.css` & `tailwind.config.ts`)
- Standard Bots brand colors:
  - Background: #0A0A0A
  - Card: #141414
  - Border: #1F1F1F
  - Accent Orange: #FF6A00
  - Text: #FFFFFF
  - Secondary text: #999999
- Dark theme optimized
- Inter font family
- Tailwind CSS utilities

### 10. **Components**

All components are production-ready with proper TypeScript typing:

- **Navbar**: Navigation with branding
- **StatusBadge**: Color-coded status indicators
- **LeadCard**: Displays lead summary with metrics
- **CompanyHeader**: Company information header (placeholder)
- **ReportView**: Report display (placeholder)
- **RobotRecommendation**: Product recommendation (placeholder)
- **OpportunityList**: Additional opportunities list
- **TalkingPoints**: Sales talking points display

### 11. **Pages**

- **Dashboard** (`src/app/page.tsx`): Welcome page with feature overview
- **Lead Report** (`src/app/lead/[id]/page.tsx`): Dynamic lead report page (placeholder for M6)

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key

# Tavily (for web research)
TAVILY_API_KEY=your-tavily-api-key

# Environment
NODE_ENV=development
```

## Key Technologies

- **Next.js 14.2.35**: React framework with API routes
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Supabase**: PostgreSQL backend with RLS
- **@slack/bolt**: Slack bot framework
- **@anthropic-ai/sdk**: Claude API integration
- **@supabase/supabase-js**: Supabase client library
- **lucide-react**: Icon library
- **@fontsource/inter**: Inter font

## Data Flow

### Lead Ingestion
1. Slack message received with HubSpot format
2. API `/api/slack` parses and validates
3. Lead created in Supabase with status "pending"

### Lead Processing
1. POST to `/api/process` with lead_id
2. **Validation Phase**: Email, domain, quality checks
3. **Research Phase**: Tavily API searches company info
4. **Report Generation**: Claude analyzes and generates recommendations
5. Lead status updated to "complete" with report

## Validation Rules

- Required fields: company_name, contact_name, contact_email
- Email format validation (RFC-style)
- Domain legitimacy checks (blocks test/fake/disposable domains)
- Generic company name detection
- Lead quality scoring (0-100)

## Error Handling

- Graceful degradation (API calls fail over to defaults)
- Comprehensive logging for debugging
- Type-safe error boundaries
- User-friendly error messages

## Next Steps (Future Milestones)

- **M1**: Slack Socket Mode integration
- **M2**: Email domain verification
- **M3**: Advanced research sources
- **M4**: AI-powered scoring refinement
- **M5**: Dashboard with lead list and metrics
- **M6**: Detailed lead intelligence reports

## Testing

Build the project:
```bash
npm run build
```

Start development server:
```bash
npm run dev
```

Health check:
```bash
curl http://localhost:3000/api/health
```

## Database Setup

1. Create Supabase project
2. Run migration: `supabase migrations up`
3. Enable RLS policies
4. Configure environment variables

## Notes

- All code is production-quality with proper TypeScript typing
- Comprehensive error handling and logging
- Modular architecture for easy expansion
- Security considerations (Slack signature verification, RLS policies)
- Prepared for integration with Slack Socket Mode (M1)
