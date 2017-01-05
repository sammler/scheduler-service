FROM kkarczmarczyk/node-yarn:7.2-slim
MAINTAINER Stefan Walther <swr.nixda@gmail.com>

RUN yarn global add nodemon

ENV HOME /home
RUN mkdir -p $HOME
WORKDIR $HOME

COPY package.json yarn.lock ./

RUN yarn

COPY /src ./src

CMD ["yarn", "run", "start"]
