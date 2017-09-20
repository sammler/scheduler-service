const schedule = require('node-schedule');
const amqpSugar = require('./lib/amqplib-sugar');
const request = require('superagent-promise')(require('superagent'), Promise);
const logger = require('winster').instance();
const _ = require('lodash');

const RABBITMQ_URI = process.env.SAMMLER_RABBITMQ_URI || 'amqp://guest:guest@localhost:5672';
const JOBS_SERVICE_URI = process.env.SAMMLER_JOBS_SERVICE_URI;
const JOBS_SERVICE_VERSION = 'v1';

// Feature Flags
// const FF_MVP_1 = process.env.FF_MVP_1 || false;

const rule = new schedule.RecurrenceRule();
rule.minute = 1;

/**
 * Posts every minute a very basic message `github.profile-sync` to s5r-rabbitmq.
 */
schedule.scheduleJob('* * * * *', () => {

  pubHeartBeat();

  // eslint-next-line capitalized-comments
  // triggerProfileSync();

});

function pubHeartBeat() {

  const cfg = {
    server: RABBITMQ_URI,
    exchange: {
      type: 'topic',
      name: 'system'
    },
    key: 'heartbeat',
    message: {
      foo: 'bar',
      bar: 'baz'
    }
  };

  // Just to make it easier afterwards
  let msg = _.clone(cfg);
  msg.job_id = undefined;

  return amqpSugar.publishMessage(msg)
    .then(() => {
      logger.info('publish message done', msg.job_id);
    })
    .catch(err => {
      logger.warn('err returned', err);
    });

}

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
          return amqpSugar.publishMessage(msg)
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

