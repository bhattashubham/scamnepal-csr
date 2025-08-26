# Frontend Dependencies

This document lists all dependencies used in the ScamNepal frontend project, their purposes, and when they were added.

## 📦 Core Dependencies (Production)

### **React & Framework**
- **`next@14.2.32`** - React framework for production (downgraded from 15 for Tailwind compatibility)
- **`react@18.3.1`** - React library (downgraded from 19 for Next.js 14 compatibility)
- **`react-dom@18.3.1`** - React DOM (downgraded from 19 for Next.js 14 compatibility)

### **Data Management & API**
- **`@tanstack/react-query@5.85.5`** - Data fetching, caching, and synchronization library
- **`@tanstack/react-query-devtools@5.85.5`** - Development tools for React Query debugging
- **`axios@1.11.0`** - HTTP client for making API calls to backend

### **State Management**
- **`zustand@5.0.8`** - Lightweight state management library

### **Forms & Validation**
- **`react-hook-form@7.62.0`** - Performant forms with easy validation
- **`@hookform/resolvers@5.2.1`** - Resolver plugins for react-hook-form (includes Zod resolver)
- **`zod@4.1.3`** - TypeScript-first schema validation library

### **Styling & UI**
- **`tailwindcss@3.4.17`** - Utility-first CSS framework
- **`class-variance-authority@0.7.1`** - Component variant styling utility
- **`clsx@2.1.1`** - Utility for constructing className strings conditionally
- **`tailwind-merge@3.3.1`** - Utility for merging Tailwind CSS classes without conflicts
- **`lucide-react@0.541.0`** - Beautiful & consistent icon toolkit

## 🔧 Development Dependencies

### **TypeScript & Types**
- **`typescript@5.9.2`** - TypeScript compiler
- **`@types/node@20.19.11`** - TypeScript definitions for Node.js
- **`@types/react@19.1.11`** - TypeScript definitions for React
- **`@types/react-dom@19.1.8`** - TypeScript definitions for React DOM

### **CSS Processing**
- **`postcss@8.5.6`** - CSS processing tool
- **`autoprefixer@10.4.21`** - CSS vendor prefixing

## 📋 Dependency History & Changes

### **Major Changes Made:**
1. **Next.js Downgrade**: 15.5.0 → 14.2.32
   - **Reason**: Tailwind CSS compatibility issues with Next.js 15
   - **Impact**: Resolved dashboard 404 errors and PostCSS configuration issues

2. **React Downgrade**: 19.1.0 → 18.3.1
   - **Reason**: Next.js 14 compatibility requirement
   - **Impact**: Ensured stable framework operation

3. **Tailwind CSS Addition**: Added complete Tailwind ecosystem
   - **Reason**: UI styling and component system requirements
   - **Impact**: Resolved styling issues and enabled modern UI development

### **Missing Dependencies Discovered & Fixed:**
1. **`@tanstack/react-query-devtools`** - Missing devtools for React Query
2. **`@hookform/resolvers`** - Missing resolver for form validation with Zod

## 🚀 Installation Commands

```bash
# Core dependencies
npm install @tanstack/react-query @tanstack/react-query-devtools axios zustand react-hook-form @hookform/resolvers zod lucide-react class-variance-authority clsx tailwind-merge

# Development dependencies
npm install -D tailwindcss postcss autoprefixer typescript @types/node @types/react @types/react-dom

# Framework (specific versions for compatibility)
npm install next@^14.2.0 react@^18.3.1 react-dom@^18.3.1
```

## ⚠️ Important Notes

- **Next.js 15**: Not compatible with current Tailwind CSS setup
- **React 19**: Not compatible with Next.js 14
- **Tailwind CSS**: Requires PostCSS configuration in CommonJS format
- **TypeScript**: Configured for strict mode disabled to avoid compilation issues

## 🔍 Troubleshooting

### **Common Issues:**
1. **Dashboard 404s**: Usually indicates server not starting due to dependency issues
2. **PostCSS Errors**: Check `postcss.config.js` format (must be CommonJS, not ES modules)
3. **Tailwind Not Working**: Verify `tailwind.config.js` and `globals.css` imports

### **Resolution Steps:**
1. Clear cache: `rm -rf .next node_modules package-lock.json`
2. Reinstall: `npm install`
3. Check configuration files format
4. Verify dependency versions in package.json
