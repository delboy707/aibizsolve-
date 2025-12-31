# QEP AISolve

AI-powered strategic consulting platform for solopreneurs and mid-market companies.

**Tagline**: Move your business fast without getting exposed.

**Value Proposition**: From messy business question to board-ready strategic plan — with the rationale, risks, and unconventional options already mapped out. In 20 minutes.

## Sprint 1 Completed ✓

### What's Implemented

1. **Next.js 16 Foundation**
   - TypeScript configured
   - App Router structure
   - Tailwind CSS v4 with custom design tokens
   - Inter font integration

2. **Supabase Integration**
   - Database schema with PWYW pricing model
   - Row-level security policies
   - Client libraries (browser, server, admin)
   - Migrations ready for deployment

3. **Core Pages**
   - Landing page with new brand copy
   - Authentication (sign up/sign in)
   - Dashboard with decision history
   - User account management

4. **Database Schema**
   - Users table (with PWYW fields)
   - Decisions table (4-layer classification)
   - Messages table
   - Documents table (with Alchemy section support)
   - Workflows table (with vector search)
   - Payment stats table

5. **Design System**
   - Navy color palette
   - Slate neutrals
   - Alchemy highlight colors
   - Typography system

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key (for Claude)
- OpenAI API key (for embeddings)
- Stripe account (for PWYW payments)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase, Anthropic, OpenAI, and Stripe credentials

4. Run database migrations:
   - Create a new Supabase project
   - Run migrations in order: `001_initial_schema.sql`, `002_workflows_table.sql`, `003_rls_policies.sql`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
qep-aisolve/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── auth/              # Authentication
│   ├── dashboard/         # User dashboard
│   ├── chat/              # Decision sessions (TODO)
│   ├── document/          # Generated documents (TODO)
│   ├── pricing/           # PWYW payment (TODO)
│   └── api/               # API routes (TODO)
├── components/            # React components (TODO)
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── ai/                # AI integration (TODO)
│   ├── stripe/            # Stripe integration (TODO)
│   └── utils/             # Utility functions
├── types/                 # TypeScript types
├── supabase/
│   └── migrations/        # Database migrations
├── scripts/               # Workflow parsing scripts
└── skills/                # Reference documentation
```

## Next Steps (Sprint 2)

- [ ] Build chat UI components
- [ ] Implement message streaming
- [ ] Create example prompts by problem theme
- [ ] Add progress indicators
- [ ] Implement "Decision" naming and status
- [ ] Add behavioral questions to intake

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI**: Claude (Anthropic), OpenAI (embeddings only)
- **Payments**: Stripe
- **Vector Search**: pgvector
- **Deployment**: Vercel (recommended)

## Key Features

### The Alchemy Layer
Counterintuitive strategic options using Rory Sutherland's behavioral economics framework. Four lenses:
1. The Opposite Lens
2. The Perception Lens
3. The Signal Lens
4. The Small Bet Lens

### Pay What You Want Pricing
- 28-day free trial with full access
- $10 minimum, no maximum
- Segment anchors guide payment
- Alchemy Layer unlocks at average payment tier

### 4-Layer Problem Classification
1. **Symptom**: Surface-level user language
2. **Challenge**: Underlying business issue
3. **Domain(s)**: Business function(s) involved
4. **Intent**: User's goal state (Explore/Decide/Execute/Monitor)

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete implementation guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [skills/SKILL.md](./skills/SKILL.md) - Skill description
- [skills/references/](./skills/references/) - Reference documentation

## License

Proprietary - All rights reserved
