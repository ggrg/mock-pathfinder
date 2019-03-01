FROM mhart/alpine-node:10.15.1
USER root

WORKDIR /opt/mock-pathfinder
COPY test /opt/mock-pathfinder/test
COPY src /opt/mock-pathfinder/src
COPY seeds /opt/mock-pathfinder/seeds
COPY migrations /opt/mock-pathfinder/migrations
COPY config /opt/mock-pathfinder/config
COPY package.json sipix-2.0.0.wsdl sipix-2.0.0.xsd sipix-common-2.0.0.xsd /opt/mock-pathfinder/

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp \
    && apk --no-cache add git

RUN npm install -g tape tap-xunit \
    && npm install

RUN apk del build-dependencies

EXPOSE 8080
EXPOSE 15353

CMD node src/server.js
