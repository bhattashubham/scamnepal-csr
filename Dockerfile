# Multi-stage Dockerfile for both Frontend and Backend

# Base Node.js image
FROM node:18-alpine AS base
WORKDIR /app

# Backend Stage
FROM base AS backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Frontend Stage  
FROM base AS frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production Backend Stage
FROM base AS backend-prod
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]

# Production Frontend Stage
FROM base AS frontend-prod
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]