FROM node:22-alpine AS build

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

WORKDIR /app

COPY fe/package*.json ./
RUN npm ci

COPY fe/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY fe/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

