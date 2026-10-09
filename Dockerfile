FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm pkg delete packageManager && npm ci
COPY . .
RUN npm run build && npx esbuild server.ts --bundle --platform=node --format=cjs --outfile=dist/server.cjs --packages=external
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
