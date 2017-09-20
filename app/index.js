const schedule = require('node-schedule');
const amqp = require('amqplib');
// eslint-next-line capitalized-comments
// const amqpSugar = require('amqplib-sugar');
const request = require('superagent-promise')(require('superagent'), Promise);
const logger = require('winster').instance();
const _ = require('lodash');

const RABBITMQ_URI = process.env.SAMMLER_RABBITMQ_URI || 'amqp://guest:guest@localhost:5672';
const JOBS_SERVICE_URI = process.env.SAMMLER_JOBS_SERVICE_URI;
const JOBS_SERVICE_VERSION = 'v1';

// Feature Flags
const FF_MVP_1 = process.env.FF_MVP_1 || false;

const rule = new schedule.RecurrenceRule();
rule.minute = 1;

function encode(doc) {
  return new Buffer(JSON.stringify(doc));
}

/**
 * Posts every minute a very basic message `github.profile-sync` to s5r-rabbitmq.
 */
schedule.scheduleJob('* * * * *', () => {

  console.log('FF_MVP_1', FF_MVP_1);
  console.log('And just another echo');

  // eslint-next-line capitalized-comments
  // triggerProfileSync();

});

// eslint-next-line capitalized-comments
// setInterval(triggerProfileSync, 20000);

// eslint-disable-next-line no-unused-vars
function triggerProfileSync() {
  const cfg = {
    server: RABBITMQ_URI,
    exchange: {
      type: 'topic',
      name: 'github.profile-sync'
    },
    key: 'sync.requested',
    message: {
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
        return Promise.reject('sammler-job-service not available', result.statusCode); // eslint-disable-line prefer-promise-reject-errors
      }

      return request
        .post(JOBS_SERVICE_URI + `/${JOBS_SERVICE_VERSION}/jobs`)
        .send({
          name: cfg.exchange.name,
          details: cfg.message
        })
        .then(result => {
          logger.trace('New job', result.body);
          const msg = _.clone(cfg);
          msg.message.job_id = result.body._id;
          return publishMessage(msg)
            .then(() => {
              logger.info('publish message done', msg.job_id);
            })
            .catch(err => {
              logger.warn('err returned', err);
            });
        });

    })

    .catch(err => {
      logger.error('Could not post a new job', err);
    });
}

// Todo: Validate opts
// Todo: Set some default values for opts
// Todo: Break out to external library (sammler/amqlib-sugar)
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
            logger.debug('publishMessage: Connection closed');

          }, 500);
        });
    });
}

