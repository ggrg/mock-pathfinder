FROM mhart/alpine-node:10.15.1

WORKDIR /opt/mock-pathfinder
COPY src /opt/mock-pathfinder/src
COPY migrations /opt/mock-pathfinder/migrations
COPY config /opt/mock-pathfinder/config
COPY package.json sipix-2.0.0.wsdl sipix-2.0.0.xsd sipix-common-2.0.0.xsd /opt/mock-pathfinder/

RUN npm install --production && \
  npm uninstall -g npm

EXPOSE 8080
EXPOSE 15353

CMD node src/server.js

