## Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

## Run stage
FROM nginx:alpine AS run
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
# Nginx config with API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 