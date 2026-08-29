FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty by default so the built SPA calls the API on its own origin (see src/api/client.ts) —
# nginx.conf reverse-proxies /api to the backend container, so no per-deployment rebuild is
# needed. Override only if the frontend and backend are served from different origins.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
