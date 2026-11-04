FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
RUN npm run build && npm run check
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node","scripts/serve.mjs","--production"]
