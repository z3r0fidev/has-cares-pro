FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/core/package*.json ./packages/core/
COPY packages/ui/package*.json ./packages/ui/
COPY tsconfig*.json ./

RUN npm install

COPY apps/web ./apps/web
COPY packages ./packages

RUN npm run build --workspace=@careequity/web

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

RUN apk add --no-cache wget
RUN addgroup -S careequity && adduser -S careequity -G careequity && chown -R careequity:careequity /app
USER careequity

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["npm", "start", "--workspace=@careequity/web"]
