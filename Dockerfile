FROM mhart/alpine-node:7.1

ENV HOME /home
RUN mkdir -p ${HOME}

WORKDIR $HOME

COPY package.json .
COPY .babelrc .

RUN npm install

COPY ./src ./src

CMD ["npm", "start"]
