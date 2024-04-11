FROM node:20

RUN apt update && apt upgrade --yes

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "script.js" ]