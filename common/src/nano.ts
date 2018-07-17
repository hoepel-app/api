import * as nanoLib from 'nano';

const url = require('url');

const buildDbUrl = () => {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const https = (process.env.DB_HTTPS || 'true').toLocaleLowerCase() !== 'false';
  const user = process.env.DB_USER;
  const pass = process.env.DB_PASS;

  if (!host || !port || !https || !user || !pass) {
    throw new Error(`Not all DB parameters are set! DB_HOST=${host}, DB_PORT=${port}, DB_HTTPS=${process.env.DB_HTTPS}, DB_USER=${user}, DB_PASS=${pass}`);
  }

  const res = new url.URL('http://example.org');
  res.host = host;
  res.port = port || '';
  res.protocol = https ? 'https' : 'http';
  res.username = user || '';
  res.password = pass || '';

  return res.toString();
};

export const nano: nanoLib.ServerScope | nanoLib.DocumentScope<any> | any = nanoLib(buildDbUrl());
