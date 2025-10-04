# HoloVitals UI Development Plan

## Overview
Build a modern, intuitive UI that integrates with all 4 backend services:
1. LightweightChatbotService
2. ContextOptimizerService
3. AnalysisQueueService
4. InstanceProvisionerService

---

## UI Architecture

### Design Principles
- **Clean & Minimal**: Open design, no cluttered navigation
- **AI-First**: Chat interface as primary interaction
- **Responsive**: Mobile-friendly design
- **Accessible**: WCAG 2.1 AA compliant
- **Fast**: Optimistic updates, streaming responses

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Context + SWR
- **Real-time**: Server-Sent Events (SSE)
- **Icons**: Lucide React

---

## Page Structure

### 1. Landing Page (/) ✅ EXISTS
- Hero section with value proposition
- Feature highlights
- How it works
- CTA to dashboard

### 2. Dashboard (/dashboard) 🔨 TO BUILD
**Layout:**
- Sidebar navigation (collapsible)
- Main content area
- Status bar (costs, queue, instances)

**Sections:**
- Overview/Home
- Documents
- Chat/Analysis
- Queue Status
- Cost Tracking
- Settings

### 3. Document Management (/dashboard/documents) 🔨 TO BUILD
- Upload zone (drag & drop)
- Document list with filters
- Document preview
- OCR status
- Context optimization status

### 4. AI Chat Interface (/dashboard/chat) 🔨 TO BUILD
- Chat history sidebar
- Main chat area with streaming
- Context indicator
- Cost per message
- Model selector (GPT-4, Claude, Llama)

### 5. Analysis Queue (/dashboard/queue) 🔨 TO BUILD
- Active tasks list
- Priority indicators
- Progress bars (0-100%)
- Task details
- Cancel/retry actions

### 6. Instance Management (/dashboard/instances) 🔨 TO BUILD
- Active instances list
- Instance details (type, region, cost)
- Provision new instance
- Terminate instances
- Cost tracking

### 7. Cost Dashboard (/dashboard/costs) 🔨 TO BUILD
- Total costs overview
- Cost breakdown by service
- Cost trends over time
- Savings visualization
- Budget alerts

---

## Component Structure

### Core Components

#### 1. Layout Components
```
components/layout/
├── DashboardLayout.tsx       - Main dashboard wrapper
├── Sidebar.tsx               - Navigation sidebar
├── Header.tsx                - Top header with user menu
├── StatusBar.tsx             - Bottom status bar
└── MobileNav.tsx             - Mobile navigation
```

#### 2. Service Components
```
components/services/
├── chatbot/
│   ├── ChatInterface.tsx     - Main chat UI
│   ├── MessageList.tsx       - Chat messages
│   ├── MessageInput.tsx      - Input with streaming
│   ├── ModelSelector.tsx     - Choose AI model
│   └── CostIndicator.tsx     - Cost per message
├── optimizer/
│   ├── OptimizationStatus.tsx - Optimization progress
│   ├── StrategySelector.tsx   - Choose strategy
│   └── SavingsDisplay.tsx     - Token savings
├── queue/
│   ├── TaskList.tsx          - Active tasks
│   ├── TaskCard.tsx          - Individual task
│   ├── ProgressBar.tsx       - Task progress
│   └── PriorityBadge.tsx     - Priority indicator
└── instances/
    ├── InstanceList.tsx      - Active instances
    ├── InstanceCard.tsx      - Instance details
    ├── ProvisionForm.tsx     - Create instance
    └── CostTracker.tsx       - Instance costs
```

#### 3. Document Components
```
components/document/
├── UploadZone.tsx ✅         - Drag & drop upload
├── DocumentCard.tsx ✅       - Document preview
├── DocumentList.tsx          - List of documents
├── DocumentViewer.tsx        - Full document view
└── OCRStatus.tsx             - OCR progress
```

#### 4. Shared UI Components
```
components/ui/
├── button.tsx ✅
├── card.tsx ✅
├── input.tsx
├── select.tsx
├── dialog.tsx
├── badge.tsx
├── progress.tsx
├── tabs.tsx
├── toast.tsx
└── skeleton.tsx
```

---

## Features to Implement

### Phase 1: Core Dashboard (Priority 1) 🔨
- [ ] Dashboard layout with sidebar
- [ ] Document upload and list
- [ ] Basic chat interface
- [ ] Status indicators

### Phase 2: Service Integration (Priority 2) 🔨
- [ ] Chat with streaming responses
- [ ] Context optimization UI
- [ ] Queue management
- [ ] Instance provisioning

### Phase 3: Advanced Features (Priority 3) 🔨
- [ ] Cost tracking dashboard
- [ ] Real-time updates (SSE)
- [ ] Advanced filters
- [ ] Batch operations

### Phase 4: Polish & Optimization (Priority 4) 🔨
- [ ] Loading states
- [ ] Error handling
- [ ] Animations
- [ ] Mobile optimization

---

## API Integration

### Service 1: Chatbot
```typescript
// Send message
POST /api/chatbot
{
  userId: string,
  conversationId?: string,
  message: string,
  model: 'gpt-4' | 'claude-3.5-sonnet' | 'llama-3.2-90b',
  stream: boolean
}

// Get conversation
GET /api/chatbot/conversations/:id
```

### Service 2: Context Optimizer
```typescript
// Optimize content
POST /api/context-optimizer
{
  userId: string,
  content: string,
  contentType: string,
  strategy: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE' | 'MINIMAL'
}

// Get stats
GET /api/context-optimizer/stats?userId=xxx
```

### Service 3: Analysis Queue
```typescript
// Create task
POST /api/analysis-queue
{
  userId: string,
  type: string,
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW',
  data: any
}

// Get task
GET /api/analysis-queue/:id

// Update progress
PATCH /api/analysis-queue/:id/progress
{
  progress: number,
  status: string
}
```

### Service 4: Instance Provisioner
```typescript
// Provision instance
POST /api/instances
{
  userId: string,
  taskId: string,
  config: {
    provider: 'AZURE' | 'AWS',
    instanceType: string,
    region: string,
    diskSizeGB: number,
    autoTerminateMinutes: number
  }
}

// Get instance
GET /api/instances/:id

// Terminate
DELETE /api/instances/:id
```

---

## State Management

### Context Providers
```typescript
// User context
UserProvider - Current user, auth state

// Chat context
ChatProvider - Active conversations, messages

// Queue context
QueueProvider - Active tasks, updates

// Instance context
InstanceProvider - Active instances, costs

// Cost context
CostProvider - Total costs, breakdown
```

### SWR Hooks
```typescript
// Data fetching
useChatConversations()
useDocuments()
useQueueTasks()
useInstances()
useCostStats()
```

---

## Real-time Updates

### Server-Sent Events (SSE)
```typescript
// Queue updates
/api/analysis-queue/stream?userId=xxx

// Instance updates
/api/instances/stream?userId=xxx

// Cost updates
/api/costs/stream?userId=xxx
```

### WebSocket (Future)
- Real-time chat
- Live progress updates
- Collaborative features

---

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Collapsible sidebar
- Bottom navigation
- Touch-friendly buttons
- Swipe gestures

---

## Performance Optimizations

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports

### Caching
- SWR for data fetching
- Image optimization
- Static generation where possible

### Bundle Size
- Tree shaking
- Minimize dependencies
- Code splitting

---

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus indicators
- ARIA labels

---

## Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- State management

### Integration Tests
- API integration
- Real-time updates
- Error handling

### E2E Tests
- User flows
- Critical paths
- Cross-browser

---

## Implementation Order

### Week 1: Core Dashboard
1. Dashboard layout
2. Sidebar navigation
3. Document upload
4. Document list

### Week 2: Chat Interface
1. Chat UI
2. Message streaming
3. Model selector
4. Cost tracking

### Week 3: Queue & Instances
1. Queue management
2. Task cards
3. Instance provisioning
4. Instance list

### Week 4: Polish & Deploy
1. Cost dashboard
2. Real-time updates
3. Error handling
4. Testing & deployment

---

## Success Metrics

### Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90

### User Experience
- Task completion rate > 90%
- Error rate < 1%
- User satisfaction > 4.5/5

### Business
- User engagement > 80%
- Feature adoption > 70%
- Cost savings visible

---

**Status:** Ready to implement  
**Next Step:** Build dashboard layout and core components