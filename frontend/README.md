# ScamNepal Frontend

A clean, modern React/Next.js frontend for the Community Scam Registry.

## 🏗️ **Project Structure**

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── dashboard/          # Dashboard routes
│   │   ├── page.tsx       # Main dashboard
│   │   ├── reports/       # Report management
│   │   ├── search/        # Search functionality
│   │   ├── entities/      # Entity management
│   │   ├── moderation/    # Moderation tools
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── users/         # User management
│   │   ├── settings/      # User settings
│   │   └── help/          # Help & support
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── providers.tsx      # App providers
├── components/             # Reusable components
│   ├── ui/                # Base UI components
│   │   ├── button.tsx     # Button component
│   │   ├── input.tsx      # Input component
│   │   ├── card.tsx       # Card component
│   │   ├── badge.tsx      # Badge component
│   │   ├── avatar.tsx     # Avatar component
│   │   ├── select.tsx     # Select component
│   │   ├── switch.tsx     # Switch component
│   │   ├── label.tsx      # Label component
│   │   └── separator.tsx  # Separator component
│   ├── forms/             # Form components
│   │   ├── LoginForm.tsx  # Login form
│   │   ├── RegisterForm.tsx # Registration form
│   │   └── OTPForm.tsx    # OTP verification form
│   └── layout/            # Layout components
│       ├── Header.tsx     # Top navigation header
│       └── Sidebar.tsx    # Side navigation
├── lib/                   # Utilities and configurations
│   ├── api/               # API client and services
│   │   ├── client.ts      # Axios client configuration
│   │   └── services/      # API service modules
│   │       ├── auth.ts    # Authentication API
│   │       ├── reports.ts # Reports API
│   │       ├── entities.ts # Entities API
│   │       ├── moderation.ts # Moderation API
│   │       └── search.ts  # Search API
│   ├── utils.ts           # Utility functions
│   └── query-client.ts    # React Query configuration
├── hooks/                 # Custom React hooks
│   ├── useReports.ts      # Reports data hooks
│   ├── useEntities.ts     # Entities data hooks
│   ├── useModeration.ts   # Moderation data hooks
│   └── useSearch.ts       # Search functionality hooks
├── stores/                # State management
│   └── auth.ts            # Authentication state store
└── types/                 # TypeScript type definitions
    └── index.ts           # All type definitions
```

## 🎯 **Key Principles**

1. **Single Responsibility**: Each file has one clear purpose
2. **Consistent Naming**: Use kebab-case for files, PascalCase for components
3. **Logical Grouping**: Related functionality grouped together
4. **No Duplication**: Single source of truth for each component/type
5. **Clear Hierarchy**: Easy to navigate and understand

## 🚀 **Getting Started**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📱 **Component Usage**

### UI Components
```tsx
import { Button, Card, Input } from '@/components/ui'

// Use components with consistent API
<Button variant="primary" size="lg">
  Click me
</Button>
```

### API Services
```tsx
import { ReportService } from '@/lib/api/services/reports'

// Use typed API calls
const reports = await ReportService.getAll()
```

### Custom Hooks
```tsx
import { useReports } from '@/hooks/useReports'

// Use data hooks for state management
const { data, isLoading } = useReports()
```

## 🔧 **Development Guidelines**

1. **Components**: Create in appropriate folder based on scope
2. **Types**: Define in `types/index.ts` for consistency
3. **API**: Use service classes for all backend communication
4. **State**: Use Zustand stores for global state, React Query for server state
5. **Styling**: Use Tailwind CSS with consistent design tokens

## 📁 **File Naming Conventions**

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useUserData.ts`)
- **Services**: PascalCase with `Service` suffix (e.g., `UserService.ts`)
- **Types**: camelCase (e.g., `userProfile.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)

## 🎨 **Design System**

- **Colors**: Consistent color palette with CSS variables
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: 4px grid system for consistent spacing
- **Components**: Reusable UI components with variants
- **Responsive**: Mobile-first design approach