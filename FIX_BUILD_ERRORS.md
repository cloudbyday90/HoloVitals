# Fix Build Errors Guide

## Issues Found

Your build failed with 38 errors. Here are the main issues and how to fix them:

### Issue 1: HTML Entity in JSX (2 errors)
**File:** `app/dashboard/analyze/[id]/page.tsx` line 150

**Problem:** `&amp;&amp;` instead of `&&`

**Fix:**
```bash
cd ~/HoloVitals
sed -i 's/&amp;&amp;/\&\&/g' app/dashboard/analyze/[id]/page.tsx
```

### Issue 2: Missing Auth Files (36 errors)
**Missing:** `lib/auth.ts` and `lib/middleware/auth.ts`

**Fix - Create lib/auth.ts:**
```bash
cd ~/HoloVitals
mkdir -p lib
cat > lib/auth.ts << 'EOF'
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' }
};
EOF
```

**Fix - Create lib/middleware/auth.ts:**
```bash
cd ~/HoloVitals
mkdir -p lib/middleware
cat > lib/middleware/auth.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';

export async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function protectCostEndpoint(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
EOF
```

## Quick Fix Script

Run this all-in-one command:

```bash
cd ~/HoloVitals && \
sed -i 's/&amp;&amp;/\&\&/g' app/dashboard/analyze/[id]/page.tsx && \
mkdir -p lib lib/middleware && \
cat > lib/auth.ts << 'EOF'
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' }
};
EOF
cat > lib/middleware/auth.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';

export async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function protectCostEndpoint(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
EOF
echo "✅ Fixes applied! Now run: npm run build"
```

## After Fixing

Run the build again:
```bash
cd ~/HoloVitals
npm run build
```

If successful, continue with the installation script or start the application.