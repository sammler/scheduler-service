FROM kkarczmarczyk/node-yarn:7.2-slim
MAINTAINER Stefan Walther <swr.nixda@gmail.com>

ENV HOME /home
RUN mkdir -p $HOME

WORKDIR $HOME

COPY package.json yarn.lock ./

RUN yarn global add nodemon && \
    yarn

COPY /src ./src

CMD ["yarn", "run", "start"]
