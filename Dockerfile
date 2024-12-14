FROM node:20-alpine as base


WORKDIR /app
COPY package.json yarn.lock ./
# Echo the value of the ENV_FILE argument
# 
FROM base as build


# install all dependencies, including devDependencies
RUN yarn 
# copy app sources
COPY . .
# build for production
RUN yarn build
# install production dependencies
RUN yarn --production 

# 
# release stage
# 
FROM base as release
# copy production dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env ./.env
COPY --from=build /app/package.json ./

EXPOSE 80 56397

CMD yarn start