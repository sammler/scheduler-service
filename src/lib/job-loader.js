const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const logger = require('winster').instance();
const amqpSugar = require('amqplib-sugar');
const config = require('./../config/config');
const _ = require('lodash');
const nodeSchedule = require('node-schedule');
const templater = require('json-templater/object');
const uuid = require('uuid/v1');

// Todo: validate params, e.g. testing if job.name is there ... (probably depending on the strategy)
class JobLoader {

  // Todo: Just some dummy jobs to test
  static dummy() {

  }

  static fromFile() {
    const filePath = path.join(__dirname, './../config/jobs/jobs.yml');
    if (fs.existsSync(filePath)) {
      let jobs = yaml.safeLoad(fs.readFileSync(filePath, 'utf8')).jobs;
      jobs.forEach(job => {
        if (job.strategy === 'interval' && job.enabled) {
          JobLoader._initIntervalJob(job);
        } else if (job.strategy === 'cron' && job.enabled) {
          JobLoader._initCronJob(job);
        }
      });
    }
  }

  static _initIntervalJob(job) {
    logger.verbose('init interval job', job.name);
    setInterval(() => {

      let msg = JobLoader._getJobMsg(job);
      JobLoader._initJob(msg);

    }, job.interval);
  }

  /**
   * Initialize a cron job
   * @param job
   * @private
   */
  static _initCronJob(job) {
    logger.verbose('init interval job', job.name);

    let msg = JobLoader._getJobMsg(job);

    nodeSchedule.scheduleJob(job.cron_def, () => {
      logger.verbose('trigger initJob from within scheduleJob', msg);
      JobLoader._initJob(msg);
    });
  }

  /**
   * Clean the parameters to pass in to RabbitMQ, extending with some defaults.
   * Todo: Add validation of the settings here ...
   * @param job
   * @private
   */
  static _getJobMsg(job) {
    let msg = _.clone(job);
    msg = _.defaults(msg, config.defaults);
    let replaceWith = {
      correlation_id: uuid()
    };
    msg.server = config.RABBITMQ_URI;
    msg = templater(msg, replaceWith);

    logger.verbose('msg', msg);
    return msg;
  }

  static _initJob(msg) {
    return amqpSugar.publishMessage(msg)
      .then(() => {
        // Todo(correlation_id)
        logger.verbose('Successfully published a message to RabbitMQ', msg.job_id, msg);
      })
      .catch(err => {
        // Todo(correlation_id)
        logger.error('Message could not be published to RabbitMQ', err);
      });
  }

  static fromService() {

  }

}

module
  .exports = JobLoader;
