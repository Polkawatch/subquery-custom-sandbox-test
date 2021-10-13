FROM onfinality/subql-node:latest

RUN npm install -g maxmind geolite2-redist \
    && node /usr/local/lib/node_modules/geolite2-redist/scripts/preload-all.js

COPY src/indexer/sandbox.js /usr/local/lib/node_modules/@subql/node/dist/indexer/sandbox.js
