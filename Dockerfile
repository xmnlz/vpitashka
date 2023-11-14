## production runner
FROM node:20-alpine as prod-runner

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN npm install -g pnpm

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    && pnpm install puppeteer


WORKDIR /bot

COPY package.json ./

RUN pnpm install --production=false

COPY . .

CMD [ "pnpm", "start:prod" ]
