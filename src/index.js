const schedule = require('node-schedule');
const amqp = require('amqplib');
const uuid = require('node-uuid');
const request = require('superagent-promise')(require('superagent'), Promise);
const logger = require('./helper/logger');

const RABBITMQ_URI = process.env.SAMMLER_RABBITMQ_URI || 'amqp://guest:guest@localhost:5672';
const JOBS_SERVICE_URI = process.env.SAMMLER_JOBS_SERVICE_URI;
const JOBS_SERVICE_VERSION = 'v1';

const rule = new schedule.RecurrenceRule();
rule.minute = 1;

function encode(doc) {
  return new Buffer(JSON.stringify(doc));
}

/**
 * Post a very basic message `github.profile-sync` to s5r-rabbitmq.
 */
schedule.scheduleJob('* * * * *', () => {

  const cfg = {
    server: RABBITMQ_URI,
    exchange: {
      type: 'topic',
      name: 'github.profile-sync'
    },
    key: 'kern.critical',
    message: {
      job_id: uuid.v4(),
      github: {
        login: 'stefanwalther',
        profile_id: 669728
      }
    }
  };

  // Todo: We could also just rely on sammler-jobs-service to be available, so just remove the health-check?!
  return request
    .get(JOBS_SERVICE_URI + '/health-check')
    .then(result => {
      if (result.statusCode !== 200) {
        return Promise.reject('sammler-job-service not available', result.statusCode);
      }

      return request
        .post(JOBS_SERVICE_URI + `/${JOBS_SERVICE_VERSION}/job`)
        .send({
          name: cfg.exchange.name,
          status: 'idle'
        })
        .then(() => {
          return publishMessage(cfg)
            .then(() => {
              logger.info('publish message done');
            })
            .catch(err => {
              logger.warn('err returned', err);
            });
        });

    })
    .catch(err => {
      logger.error('Could not reach job-service health-check', err);
    });

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
          logger.debug(" [x] Sent %s:'%s'", opts.key, JSON.stringify(opts.message, null)); // eslint-disable-line quotes
          setTimeout(() => {
            conn.close();
            logger.debug('connection closed');
          }, 500);
        });
    });
}

