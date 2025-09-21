FROM node:20-alpine

WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm ci

# Code
COPY . .

# Prisma + build
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
