const schedule = require('node-schedule');
const amqp = require('amqplib');

const RABBITMQ_URI = process.env.SAMMLER_RABBITMQ_URI || 'amqp://guest:guest@localhost:5672';
// const JOBS_SERVICE_URI = process.evn.SAMMLER_JOBS_SERVICE_URI ;

const rule = new schedule.RecurrenceRule();
rule.minute = 1;

function encode(doc) {
  return new Buffer(JSON.stringify(doc));
}

/**
 * Post a very basic message `sammler-strategy-github` to s5r-rabbitmq.
 */
schedule.scheduleJob('* * * * *', () => {

  const cfg = {
    server: RABBITMQ_URI,
    exchange: {
      type: 'direct',
      name: 'topics_logs'
    },
    key: 'kern.critical',
    message: {
      foo: 'bar',
      bar: 'baz'
    }
  };
  // Todo: Create the job first, so that we also have an Id
  publishMessage(cfg)
    .then(() => {
      console.log('publish message done');
    })
    .catch(err => {
      console.warn('err returned', err);
    });

  // const open = amqp.connect(RABBITMQ_URI);
  // const queue = 'queue';
  // open.then(conn => {
  //   return conn.createChannel()
  //     .then(channel => {
  //       return Promise.all([
  //         channel.assertQueue(queue),
  //         channel.sendToQueue(queue, encode('sammler-strategy-github'), {persistent: true})
  //       ]);
  //     });
  // })
  //   .catch(err => {
  //     console.log('error connecting to RabbitMG', err);
  //   });
});

// Todo: Validate opts
// Todo: Set some default values for opts
/**
 * Post a message to RabbitMq.
 * @param {object} opts - Configuration to use to publish a message.
 * @param {object} opts.server - RabbitMQ server. If a string is passed, it's just the URI.
 * @param {object} opts.exchange - Information about the exchange.
 * @param {string} opts.exchange.type - 'topic', 'direct'
 * @param {string} opts.exchange.name - Name of the exchange.
 * @param {string} opts.key - Key to publish the message.
 * @param {object} opts.message - The message to post.
 */
function publishMessage(opts) {
  return amqp.connect(opts.server)
    .then(conn => {
      conn.createChannel()
        .then(ch => {
          ch.assertExchange(opts.exchange.name, opts.exchange.type, {durable: true});
          ch.publish(opts.exchange.name, opts.key, encode(opts.message));
          console.log(" [x] Sent %s:'%s'", opts.key, JSON.stringify(opts.message, null)); // eslint-disable-line quotes
          setTimeout(() => {
            conn.close();
            console.log('connection closed');
          }, 500);
        });
    });
}

