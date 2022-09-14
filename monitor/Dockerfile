FROM node:16


WORKDIR /
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "script.js" ]

