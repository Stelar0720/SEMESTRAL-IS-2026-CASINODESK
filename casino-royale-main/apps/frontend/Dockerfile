FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci --ignore-scripts

COPY . .
RUN npm test
RUN npm run build

FROM nginx:1.27-alpine AS final
WORKDIR /usr/share/nginx/html

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
