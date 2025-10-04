# EHR Connection Wizard

A comprehensive, multi-step wizard for connecting to Electronic Health Record (EHR) systems.

## Overview

The Connection Wizard guides users through the process of connecting to their EHR system with a smooth, intuitive interface. It supports 7 major EHR providers covering 75%+ of the U.S. hospital market.

## Features

- ✅ **Multi-step wizard flow** with progress tracking
- ✅ **7 EHR providers** supported (Epic, Cerner, MEDITECH, etc.)
- ✅ **Dynamic form fields** based on selected provider
- ✅ **Real-time validation** with Zod schemas
- ✅ **Connection testing** with visual feedback
- ✅ **Error handling** with troubleshooting guidance
- ✅ **Success screen** with next steps
- ✅ **Responsive design** for all screen sizes
- ✅ **Accessible** with proper ARIA labels

## Components

### 1. ConnectionWizard (Main Component)
The orchestrator component that manages the wizard state and renders the appropriate step.

```tsx
import { ConnectionWizard } from '@/components/ehr/ConnectionWizard';

<ConnectionWizard patientId="user-id" />
```

### 2. ProviderSelector
Displays cards for each supported EHR provider with market share and descriptions.

**Features:**
- Provider cards with hover effects
- Market share badges
- Documentation links
- Selection state management

### 3. CredentialsForm
Dynamic form that adapts based on the selected provider.

**Features:**
- Provider-specific fields
- Form validation with Zod
- Password field masking
- Help text and documentation links
- Loading states

### 4. ConnectionTest
Shows loading state while testing the connection.

**Features:**
- Animated progress bar
- Step-by-step progress indicators
- Visual feedback
- Smooth transitions

### 5. SuccessScreen
Displays success message and next steps after successful connection.

**Features:**
- Connection details summary
- Quick action buttons
- Recommended next steps
- Navigation to other features

### 6. ErrorScreen
Shows error message with troubleshooting guidance.

**Features:**
- Error type detection
- Context-specific solutions
- Retry functionality
- Help resources
- Technical details (collapsible)

## Wizard Flow

```
1. Provider Selection
   ↓
2. Credentials Entry
   ↓
3. Connection Testing
   ↓
4. Success / Error
```

## Usage

### Basic Usage

```tsx
import { ConnectionWizard } from '@/components/ehr/ConnectionWizard';

export default function ConnectPage() {
  return <ConnectionWizard patientId="patient-123" />;
}
```

### With Custom Styling

```tsx
<div className="container mx-auto py-8">
  <ConnectionWizard patientId="patient-123" />
</div>
```

## Supported Providers

| Provider | Market Share | Additional Fields |
|----------|--------------|-------------------|
| Epic Systems | 41.3% | None |
| Oracle Cerner | 21.8% | Tenant ID |
| MEDITECH | 11.9% | Facility ID |
| athenahealth | 1.1% | Practice ID |
| eClinicalWorks | Top 10 | Practice ID |
| Allscripts | Top 10 | App Name, Platform |
| NextGen | Top 10 | Practice ID |

## Provider Configuration

Each provider requires different configuration fields. The wizard automatically shows the correct fields based on the selected provider.

### Example: Epic Configuration
```typescript
{
  baseUrl: "https://fhir.epic.com",
  clientId: "your-client-id",
  clientSecret: "your-client-secret"
}
```

### Example: Cerner Configuration
```typescript
{
  baseUrl: "https://fhir.cerner.com",
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  additionalConfig: {
    tenantId: "your-tenant-id"
  }
}
```

## State Management

The wizard uses the `useConnectionWizard` hook for state management:

```typescript
const {
  state,           // Current wizard state
  isLoading,       // Loading indicator
  selectProvider,  // Select a provider
  submitCredentials, // Submit credentials
  retry,           // Retry connection
  reset,           // Reset wizard
  goBack,          // Go to previous step
} = useConnectionWizard(patientId);
```

## API Integration

The wizard integrates with the `/api/ehr/connect` endpoint:

```typescript
POST /api/ehr/connect
{
  "patientId": "uuid",
  "provider": "EPIC",
  "config": {
    "baseUrl": "https://fhir.epic.com",
    "clientId": "client-id",
    "clientSecret": "client-secret"
  }
}
```

## Error Handling

The wizard provides context-specific error messages and solutions:

### Authentication Errors
- Verify credentials
- Check expiration
- Confirm registration
- Review OAuth scopes

### Network Errors
- Check internet connection
- Verify Base URL
- Check EHR accessibility
- Review firewall settings

### Permission Errors
- Verify account permissions
- Check API access
- Confirm application approval
- Contact administrator

## Styling

The wizard uses Tailwind CSS and Shadcn UI components:

- **Colors:** Primary, destructive, muted
- **Spacing:** Consistent padding and margins
- **Typography:** Clear hierarchy
- **Animations:** Smooth transitions
- **Responsive:** Mobile-first design

## Accessibility

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Focus management
- ✅ Color contrast compliance

## Testing

### Unit Tests
```bash
npm test components/ehr/ConnectionWizard
```

### Integration Tests
```bash
npm test:integration ehr-connection
```

### E2E Tests
```bash
npm test:e2e ehr-connection-flow
```

## Customization

### Custom Provider
Add a new provider to `lib/constants/ehr-providers.ts`:

```typescript
export const EHR_PROVIDERS = {
  // ... existing providers
  CUSTOM: {
    id: 'CUSTOM',
    name: 'custom',
    displayName: 'Custom EHR',
    description: 'Custom EHR system',
    marketShare: 'N/A',
    color: '#000000',
    website: 'https://custom.com',
    documentationUrl: 'https://docs.custom.com',
  },
};
```

### Custom Fields
Add provider-specific fields to `PROVIDER_CONFIG_FIELDS`:

```typescript
CUSTOM: {
  baseUrl: { /* ... */ },
  clientId: { /* ... */ },
  clientSecret: { /* ... */ },
  additionalFields: [
    {
      name: 'customField',
      label: 'Custom Field',
      placeholder: 'Enter value',
      helpText: 'Help text',
      required: true,
    },
  ],
},
```

## Dependencies

- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Shadcn UI** - UI components
- **Lucide React** - Icons
- **Next.js** - Framework

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **Initial Load:** < 1s
- **Step Transition:** < 100ms
- **Form Validation:** Real-time
- **API Call:** 2-5s (depends on provider)

## Security

- ✅ Credentials encrypted in transit (HTTPS)
- ✅ Credentials encrypted at rest (AES-256)
- ✅ No credentials stored in browser
- ✅ OAuth 2.0 authentication
- ✅ HIPAA-compliant audit logging

## Troubleshooting

### Wizard not loading
- Check if `patientId` is provided
- Verify authentication
- Check console for errors

### Form validation errors
- Ensure all required fields are filled
- Verify URL format
- Check field constraints

### Connection fails
- Verify credentials are correct
- Check Base URL
- Ensure EHR system is accessible
- Review error message for details

## Support

- **Documentation:** `/docs/ehr-connection`
- **Troubleshooting:** `/docs/ehr-troubleshooting`
- **Contact:** `/contact`

## License

Proprietary - HoloVitals Platform

---

**Last Updated:** 2025-01-01
**Version:** 1.0.0
**Status:** Production Ready