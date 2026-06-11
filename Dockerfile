FROM node:20-alpine

RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src
RUN npm install --save-dev typescript @types/node
RUN npx tsc

CMD ["node", "dist/index.js"]
