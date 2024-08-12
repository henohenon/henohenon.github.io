FROM node:latest

WORKDIR /app

COPY app/ ./

RUN npm install -g pnpm

RUN pnpm install

CMD ["pnpm", "run", "dev"]

EXPOSE 3000