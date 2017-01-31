FROM kkarczmarczyk/node-yarn:7.2

RUN yarn global add nodemon

ENV HOME /home
RUN mkdir -p $HOME
WORKDIR $HOME


COPY package.json yarn.lock ./

RUN yarn install

COPY /src ./src

CMD ["yarn", "run", "start"]
