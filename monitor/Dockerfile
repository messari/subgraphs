FROM node:16

RUN apt update && apt upgrade --yes

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "script.js" ]