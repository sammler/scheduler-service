const amqp = require('amqplib');
const logger = require('winster').instance();

function encode(doc) {
  return new Buffer(JSON.stringify(doc));
}

class AmqpSugarLib {

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
  static publishMessage(opts) {
    return amqp.connect(opts.server)
      .then(conn => {
        conn.createChannel()
          .then(ch => {
            ch.assertExchange(opts.exchange.name, opts.exchange.type, {durable: true});
            ch.publish(opts.exchange.name, opts.key, encode(opts.message));
            // Todo: console.log(' [x] Sent %s:"%s"', opts.key, JSON.stringify(opts.message, null));
            logger.trace(` [x] Sent ${opts.key}: ${JSON.stringify(opts.message, null)}`);
            setTimeout(() => {
              conn.close();
              logger.trace('publishMessage: Connection closed');
            }, 500);
          });
      });
  }

}

module.exports = AmqpSugarLib;
