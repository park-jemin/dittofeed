# Rebuild the source code only when needed
FROM node:18.4.0 AS builder

WORKDIR /service

COPY *.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY ./packages/worker/*.json ./packages/worker/
COPY ./packages/backend-lib/*.json ./packages/backend-lib/
COPY ./packages/isomorphic-lib/*.json ./packages/isomorphic-lib/

RUN yarn workspaces focus worker --production && \
    cp -R node_modules production_node_modules
RUN yarn workspaces focus worker

COPY ./packages/backend-lib/ ./packages/backend-lib
COPY ./packages/isomorphic-lib/ ./packages/isomorphic-lib
COPY ./packages/worker/ ./packages/worker

RUN yarn workspace backend-lib prisma generate && \
    yarn workspace worker build

# Production image
FROM node:18.4.0 AS runner

WORKDIR /service

COPY --from=builder /service/production_node_modules ./node_modules
COPY --from=builder /service/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /service/package.json ./package.json

COPY --from=builder /service/packages/worker/dist ./packages/worker/dist
COPY --from=builder /service/packages/worker/package.json ./packages/worker/package.json

COPY --from=builder /service/packages/backend-lib/dist ./packages/backend-lib/dist
COPY --from=builder /service/packages/backend-lib/package.json ./packages/backend-lib/package.json

COPY --from=builder /service/packages/isomorphic-lib/dist ./packages/isomorphic-lib/dist
COPY --from=builder /service/packages/isomorphic-lib/package.json ./packages/isomorphic-lib/package.json

ENV NODE_ENV=production

CMD ["yarn", "workspace", "worker", "node", "./dist/scripts/startWorker.js"]
