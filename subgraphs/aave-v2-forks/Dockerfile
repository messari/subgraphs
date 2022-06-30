FROM ubuntu:20.04

ARG BUILDPLATFORM=linux/x86_64

ENV ARGS=""

RUN apt update
RUN apt install -y nodejs
RUN apt install -y npm
RUN apt install -y git
RUN apt install -y postgresql
RUN apt install -y curl
RUN apt install -y cmake

RUN curl -OL https://github.com/LimeChain/matchstick/releases/download/0.4.0/binary-linux-20
RUN chmod a+x binary-linux-20

RUN mkdir matchstick
WORKDIR /matchstick

COPY ./ .

RUN npm run codegen
RUN npm run build

CMD ../binary-linux-20 ${ARGS}