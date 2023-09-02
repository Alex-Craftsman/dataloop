FROM node:18

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --ignore-scripts

COPY . .

ENV NODE_PATH=./dist

RUN yarn run compile

FROM scratch AS export

COPY --from=0 /app/dist .