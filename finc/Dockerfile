# FINC 2.0 — imagem de produção (API + front-end compilado na mesma origem)
FROM node:22.21.1-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages packages
COPY apps apps
COPY db db
RUN npm run build && npm prune --omit=dev --workspaces --include-workspace-root && mkdir -p apps/api/node_modules packages/shared/node_modules

FROM node:22.21.1-bookworm-slim
ENV NODE_ENV=production SERVE_WEB=true PORT=3333
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/db db
USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3333/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node apps/api/dist/db/migrate-cli.js && exec node apps/api/dist/server.js"]
