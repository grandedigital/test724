FROM node:20-alpine

# App dizini
WORKDIR /app

# package.json kopyala
COPY package*.json ./

# bağımlılıkları kur
RUN npm install

# tüm projeyi kopyala
COPY . .

# build (admin panel için)
RUN npm run build

# port
EXPOSE 1337

# start
["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "5700"]