FROM node:18 AS build

WORKDIR /app

COPY . /app/

# Install yarn and build project
RUN yarn install
RUN yarn lerna run build --no-private && yarn workspace newstats build

FROM nginx:1.16.0-alpine
COPY --from=build /app/packages/new_stats/dist /usr/share/nginx/html
