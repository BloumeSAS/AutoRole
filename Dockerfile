FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

# Ensure data directory exists
RUN mkdir -p data

CMD ["node", "src/index.js"]
