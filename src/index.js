const schedule = require( 'node-schedule' );
const amqp = require('amqplib');
const URL = process.env.SAMMLER_RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

let rule = new schedule.RecurrenceRule();
rule.minute = 1;

function encode(doc) {
  return new Buffer(JSON.stringify(doc));
}

let j = schedule.scheduleJob( '* * * * *', function() {
  let d = new Date();

  console.log( 'The answer to life, the universe, and everything!', d.toJSON() );


  let open = amqp.connect( URL );
  let queue = 'queue';
  open.then( conn => {
    return conn.createChannel()
      .then( (channel) => {
        return Promise.all([
          channel.assertQueue(queue),
          channel.sendToQueue(queue, encode('sammler_github'), {persistent: true})
        ]);
      });
  });

} );
