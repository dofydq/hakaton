FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
# Гарантируем, что react-hot-toast всегда установлен
RUN npm install react-hot-toast --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
