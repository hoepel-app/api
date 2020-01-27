import * as functions from "firebase-functions";
import * as nodemailer from 'nodemailer';
import mailgunTransport from 'nodemailer-mailgun-transport';

const auth = {
  auth: {
    api_key: functions.config().mailgun.apikey,
    domain: functions.config().mailgun.domain,
  },
}

export const nodemailerMailgun = nodemailer.createTransport(mailgunTransport(auth));
