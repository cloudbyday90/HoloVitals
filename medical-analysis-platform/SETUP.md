# Quick Setup Guide

This guide will help you get the Medical Document Analysis Platform running locally in minutes.

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 18 or higher installed
- ✅ PostgreSQL database (local or cloud)
- ✅ OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js, React, TypeScript
- Prisma (database ORM)
- OpenAI SDK
- PDF parsing libraries
- OCR libraries
- UI components

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/medical_analysis?schema=public"

# OpenAI API - Add your API key
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Application Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up Database

Initialize Prisma and create database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push
```

**Note**: If you don't have PostgreSQL installed locally, you can:
- Use a cloud provider (Supabase, Railway, Neon)
- Install PostgreSQL locally:
  - **macOS**: `brew install postgresql`
  - **Ubuntu**: `sudo apt-get install postgresql`
  - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Verify Installation

1. **Homepage**: Visit http://localhost:3000 - you should see the landing page
2. **Dashboard**: Click "Get Started" or visit http://localhost:3000/dashboard
3. **Upload Test**: Try uploading a sample PDF or image file
4. **Analysis**: Click "Analyze" on a document to test the AI features

## Common Issues & Solutions

### Issue: Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Or check service status
   sudo service postgresql status
   ```

2. Check your DATABASE_URL in `.env`
3. Ensure database exists:
   ```bash
   createdb medical_analysis
   ```

### Issue: OpenAI API Error

**Error**: `Invalid API key` or `Unauthorized`

**Solution**:
1. Verify your OPENAI_API_KEY in `.env`
2. Check you have credits in your OpenAI account
3. Ensure the key starts with `sk-`

### Issue: Module Not Found

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Use a different port
PORT=3001 npm run dev

# Or kill the process using port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
npx prisma generate
```

## Testing the Application

### 1. Test Document Upload

1. Go to Dashboard
2. Drag and drop a PDF or image file
3. Wait for processing to complete
4. Verify document appears in the list

### 2. Test OCR Processing

Upload a document with text and verify:
- Text is extracted correctly
- Document type is identified
- Structured data is parsed (for bloodwork)

### 3. Test AI Analysis

1. Click "Analyze" on a processed document
2. Ask questions like:
   - "What are the key findings?"
   - "Are there any abnormal values?"
   - "Summarize this document"
3. Verify AI responds with relevant information

## Sample Test Documents

For testing, you can use:
- Sample bloodwork results (PDF)
- Medical imaging reports (PDF)
- Any medical document with text

**Note**: Use only test/sample documents, never real patient data during development.

## Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `app/` or `components/`
   - Changes auto-reload in browser
   
2. **Backend Changes**: Edit files in `app/api/` or `lib/services/`
   - API routes auto-reload
   
3. **Database Changes**: Edit `prisma/schema.prisma`
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### Viewing Database

Use Prisma Studio to view/edit database:
```bash
npx prisma studio
```

Opens at http://localhost:5555

### Checking Logs

- **Application logs**: Check terminal where `npm run dev` is running
- **API logs**: Check browser console and terminal
- **Database logs**: Check PostgreSQL logs

## Next Steps

Once you have the application running:

1. **Explore Features**: Try all the features to understand the platform
2. **Read Documentation**: Review `ARCHITECTURE.md` for technical details
3. **Customize**: Modify components and styling to match your needs
4. **Add Authentication**: Implement user authentication (see roadmap)
5. **Deploy**: Follow `DEPLOYMENT.md` when ready for production

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review error messages in terminal and browser console
3. Check the main README.md for additional information
4. Review the code comments and documentation
5. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

## Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start               # Start production server

# Database
npx prisma studio       # Open database GUI
npx prisma generate     # Generate Prisma Client
npx prisma db push      # Push schema changes
npx prisma migrate dev  # Create migration

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript types

# Cleanup
rm -rf .next            # Clear Next.js cache
rm -rf node_modules     # Remove dependencies
npm install             # Reinstall dependencies
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_URL | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| OPENAI_API_KEY | Yes | OpenAI API key for AI features | `sk-...` |
| NODE_ENV | No | Environment mode | `development` or `production` |
| NEXT_PUBLIC_APP_URL | No | Application URL | `http://localhost:3000` |
| JWT_SECRET | No | Secret for JWT tokens | Random string |
| MAX_FILE_SIZE_MB | No | Max upload size in MB | `10` |
| UPLOAD_DIR | No | Directory for uploads | `./uploads` |

## Success Checklist

Before considering setup complete, verify:

- [ ] Application starts without errors
- [ ] Homepage loads correctly
- [ ] Dashboard is accessible
- [ ] Can upload a document
- [ ] OCR processing works
- [ ] AI analysis responds to queries
- [ ] Database connection is stable
- [ ] No console errors

## Ready to Build!

You're all set! The platform is now running locally and ready for development or testing. Happy coding! 🚀