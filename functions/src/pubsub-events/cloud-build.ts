import * as functions from 'firebase-functions';
import { IncomingWebhook } from '@slack/client';

// Send Slack message on build events
// Based on https://cloud.google.com/cloud-build/docs/configure-third-party-notifications

const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

// eventToBuild transforms pubsub event message to a build object.
const eventToBuild = (data: string) => {
  return JSON.parse(new Buffer(data, 'base64').toString());
};

// createSlackMessage create a message from a build object.
const createSlackMessage = (build) => {
  const message = {
    text: `Build \`${build.id}\``,
    mrkdwn: true,
    attachments: [
      {
        title: 'Build logs',
        title_link: build.logUrl,
        fields: [{
          title: 'Status',
          value: build.status
        }]
      }
    ]
  };
  return message
};

export const onCloudBuildPubsub = functions.region('europe-west1').pubsub.topic('cloud-builds').onPublish((message, context) => {
  const build = eventToBuild(message.data);

  // Skip if the current status is not in the status list.
  // Add additional statues to list if you'd like:
  // QUEUED, WORKING, SUCCESS, FAILURE,
  // INTERNAL_ERROR, TIMEOUT, CANCELLED
  const status = ['SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT'];
  if (status.indexOf(build.status) === -1) {
    return Promise.resolve();
  }

  // Send message to Slack.
  return webhook.send(createSlackMessage(build));
});
