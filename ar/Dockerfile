FROM node:18.12

RUN npm install -g pnpm

WORKDIR /app

COPY ./henohenos .

RUN pnpm install

CMD ["pnpm", "run", "dev"]

EXPOSE 8000