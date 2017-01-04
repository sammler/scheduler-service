const schedule = require('node-schedule');
const amqp = require('amqplib');
const URL = process.env.SAMMLER_RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

let rule = new schedule.RecurrenceRule();
rule.minute = 1;

function encode(doc) {
  return new Buffer(JSON.stringify(doc));
}

/**
 * Post a very basic message `sammler-strategy-github` to s5r-rabbitmq.
 */
let j = schedule.scheduleJob('* * * * *', function () {
  let open = amqp.connect(URL);
  let queue = 'queue';
  open.then(conn => {
    return conn.createChannel()
      .then((channel) => {
        return Promise.all([
          channel.assertQueue(queue),
          channel.sendToQueue(queue, encode('sammler-strategy-github'), {persistent: true})
        ]);
      });
  })
    .catch( (err) => {
      console.log('error connecting to RabbitMG', err);
    });
});
