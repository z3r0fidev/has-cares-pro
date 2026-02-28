FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/core/package*.json ./packages/core/
COPY packages/db/package*.json ./packages/db/
COPY tsconfig*.json ./

RUN npm install

COPY apps/api ./apps/api
COPY packages ./packages

RUN npm run build --workspace=@careequity/api

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages

RUN apk add --no-cache wget
RUN addgroup -S careequity && adduser -S careequity -G careequity && chown -R careequity:careequity /app
USER careequity

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
