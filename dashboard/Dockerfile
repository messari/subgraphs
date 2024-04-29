# pull the base image
FROM node:20

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

RUN node public/buildPruningSlugs.js

# start app
CMD ["yarn", "start"]