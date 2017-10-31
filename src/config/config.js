
module.exports = {
  RABBITMQ_URI: process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672',
  JOBS_SERVICE_URI: process.env.JOBS_SERVICE_URI,
  JOBS_SERVICE_VERSION: 'v1',
  LOAD_JOBS_FROM_FILE: process.env.LOAD_JOBS_FROM_FILE || false,
  nodeEnv: process.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  defaults: {
    // RabbitMQ default retry-behavior (see amqplib-sugar)
    retry_behavior: {
      enabled: true,
      retries: 10,
      // Todo: interval has definitely to be increased ...
      // Todo: Would be nice to have "non hurting" setting here ...
      interval: 1000
    }
  }
};
