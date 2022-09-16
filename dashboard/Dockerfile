# pull the base image
FROM node:lts-alpine

# set the working direction
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./

COPY yarn.lock ./

RUN yarn

# add app
COPY . ./

ADD https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.dev.json ./public

# start app
CMD ["yarn", "start"]