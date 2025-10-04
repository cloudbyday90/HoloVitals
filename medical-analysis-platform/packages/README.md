# HoloVitals Microservices Packages

This directory contains all microservices for the HoloVitals platform.

## 📦 Packages

### **Frontend**
- **Path**: `packages/frontend/`
- **Technology**: Next.js 15, React, TypeScript
- **Deployment**: Vercel
- **Port**: 3000
- **Description**: User interface for HoloVitals

### **Auth Service**
- **Path**: `packages/auth-service/`
- **Technology**: Node.js, Express, Prisma
- **Deployment**: Railway
- **Port**: 4000
- **Description**: Authentication and authorization microservice

### **Patient Repository**
- **Path**: `packages/patient-repository/`
- **Technology**: Node.js, Express, Prisma
- **Deployment**: Railway
- **Port**: 5000
- **Description**: Patient data management microservice

### **Medical Standards**
- **Path**: `packages/medical-standards/`
- **Technology**: Node.js, Express, Prisma
- **Deployment**: Railway
- **Port**: 5001
- **Description**: LOINC, SNOMED, ICD-10, CPT code management

### **Monolith**
- **Path**: `packages/monolith/`
- **Technology**: Node.js, Express, Prisma
- **Deployment**: Railway
- **Port**: 5100
- **Description**: Temporary monolith for AI, EHR, Payment, Document services

## 🔄 Shared Code

### **Types**
- **Path**: `shared/types/`
- **Description**: Shared TypeScript types and interfaces

### **Utils**
- **Path**: `shared/utils/`
- **Description**: Shared utility functions

## 🚀 Getting Started

Each package can be developed and deployed independently. See individual package READMEs for specific instructions.

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │   Patient    │    │   Medical    │
│  Port: 4000  │    │  Repository  │    │  Standards   │
│              │    │  Port: 5000  │    │  Port: 5001  │
└──────────────┘    └──────────────┘    └──────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │   Monolith   │
                    │  Port: 5100  │
                    │              │
                    │ • AI         │
                    │ • EHR        │
                    │ • Payment    │
                    │ • Document   │
                    └──────────────┘
```

## 💰 Cost Breakdown

```
Service                     Cost/Month
─────────────────────────────────────
Frontend (Vercel)           $0
Auth Service (Railway)      $15
Patient Repository          $15
Medical Standards           $15
Monolith                    $30
API Gateway                 $10
Buffer                      $15
─────────────────────────────────────
Total                       $100/month
```