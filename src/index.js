const schedule = require('node-schedule');
const amqpSugar = require('amqplib-sugar');
const request = require('superagent-promise')(require('superagent'), Promise);
const logger = require('winster').instance();
const _ = require('lodash');
const config = require('./config/config');
const jobLoader = require('./lib/job-loader');

if (config.nodeEnv) {
  // Todo: logger.verbose('config', config);
}

if (config.LOAD_JOBS_FROM_FILE) {
  logger.verbose('load from file');
  jobLoader.fromFile();
}

jobLoader.fromService();

const rule = new schedule.RecurrenceRule();
rule.minute = 1;

/**
 * Posts every minute a very basic message `github.profile-sync` to s5r-rabbitmq.
 */
schedule.scheduleJob('* * * * *', () => {

  // Todo: Just some test comment
  // pubHeartBeat();

  // eslint-next-line capitalized-comments
  // triggerProfileSync();

});

// eslint-next-line capitalized-comments
// setInterval(triggerProfileSync, 20000);

// eslint-disable-next-line no-unused-vars
function triggerProfileSync() {
  const cfg = {
    server: config.RABBITMQ_URI,
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
    .get(config.JOBS_SERVICE_URI + '/health-check')
    .then(result => {
      if (result.statusCode !== 200) {
        return Promise.reject('sammler-job-service not available', result.statusCode); // eslint-disable-line prefer-promise-reject-errors
      }

      return request
        .post(config.JOBS_SERVICE_URI + `/${config.JOBS_SERVICE_VERSION}/jobs`)
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
              logger.error('err returned', err);
            });
        });
    })

    .catch(err => {
      logger.error('Could not post a new job', err);
    });
}

