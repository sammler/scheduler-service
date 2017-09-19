# --------------------------------------
#               BASE NODE
# --
# We need full node as we need git to download
# from some GitHub repos as of now.
# --------------------------------------
FROM node:8.4.0 as BASE

ARG PORT=3000
ENV PORT=$PORT

ENV HOME /home
RUN mkdir -p $HOME
WORKDIR $HOME

COPY package.json package-lock.json ./

# --------------------------------------
#              DEPENDENCIES
# --------------------------------------
FROM BASE as DEPENDENCIES

RUN npm install --only=production

# copy production node_modules aside
RUN cp -R node_modules prod_node_modules

# install ALL node_modules, including 'devDependencies'
RUN npm install

# --------------------------------------
#                  TEST
# --------------------------------------
# run linters, setup and tests
FROM dependencies AS TEST

COPY .eslintrc.json .
COPY /src ./src/
COPY /test ./test/

RUN  npm run lint && npm run test


# --------------------------------------
#                 RELEASE
# --------------------------------------
FROM node:8.4.0-alpine as RELEASE

# copy production node_modules
COPY --from=dependencies /home/prod_node_modules ./node_modules
COPY /src ./src/

EXPOSE $PORT

CMD ["npm", "run", "start"]
