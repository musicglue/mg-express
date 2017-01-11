import AWS from 'aws-sdk';
import os from 'os';
import profiler from '@risingstack/v8-profiler';

import { subscribe } from './config';
import logger from './logger';

export default () => {
  const S3 = new AWS.S3({
    params: {
      Bucket: process.env.PROFILING_BUCKET,
      ContentType: 'application/json',
    },
    ...(process.env.AWS_ENV === 'local'
      ? { endpoint: 'http://localhost:4567', sslEnabled: false, s3ForcePathStyle: true }
      : { region: 'eu-west-1' }),
  });


  let profileRunning = null;

  const start = name => {
    profileRunning = `${name}/${os.hostname()}/${process.pid}.cpuprofile`;
    profiler.startProfiling(profileRunning, true);
    logger.info(`Started CPU profile: ${profileRunning}`);
  };

  const stop = () => {
    logger.info(`Stopping CPU profile: ${profileRunning}`);
    const name = profileRunning;
    const profile = profiler.stopProfiling(name);
    profileRunning = null;

    Promise.fromCallback(cb => profile.export(cb))
      .then(result => S3.putObject({ Key: name, Body: result }).promise())
      .then(() => logger.info(`Exported & uploaded CPU profile ${name}`))
      .catch(err => {
        logger.error(`Error exporting & uploading CPU profile ${name}`, err, err.stack);
        throw err;
      })
      .finally(() => profile.delete());
  };

  subscribe('V8_PROFILE', value => {
    if (value && !profileRunning) {
      start(value);
    } else if (profileRunning && !value) {
      stop();
    }
  });

  const takeSnapshot = name => {
    logger.info(`Taking heap snapshot ${name}`);
    const snapshot = profiler.takeSnapshot();
    Promise.fromCallback(cb => snapshot.export(cb))
      .then(result => S3.putObject({
        Key: `${name}/${os.hostname()}/${process.pid}.heapsnapshot`,
        Body: result,
      }).promise())
      .then(() => logger.info(`Exported & uploaded heap snapshot ${name}`))
      .catch(err => {
        logger.error(`Error exporting & uploading heap snapshot ${name}`);
        throw err;
      })
      .finally(() => snapshot.delete());
  };

  subscribe('V8_HEAP_SNAPSHOT', (value, initial) => {
    console.log('V8_HEAP_SNAPSHOT', { value, initial });
    if (value && !initial) takeSnapshot(value);
  });
};
