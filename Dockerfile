# Vyber UI — build the React app, serve it with nginx, and proxy /api to
# the API container (same-origin, exactly like the Vite dev proxy).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty in the compose/EC2 setup (nginx proxies /api). Set it only for a
# split-origin deployment, and add that origin to the API's CORS list.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
