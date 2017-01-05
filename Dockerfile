FROM kkarczmarczyk/node-yarn:7.2-slim
MAINTAINER Stefan Walther <swr.nixda@gmail.com>

ENV HOME /home
RUN mkdir -p ${HOME}

WORKDIR $HOME

COPY package.json yarn.lock ./

RUN yarn install

COPY ./src ./src

CMD ["npm", "start"]
