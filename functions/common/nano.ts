import nanoLib = require('nano');

const url = require('url');

const buildDbUrl = () => {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const https = process.env.DB_HTTPS.toLocaleLowerCase() !== 'false';
  const user = process.env.DB_USER;
  const pass = process.env.DB_PASS;

  const res = new url.URL('http://example.org');
  res.host = host;
  res.port = port || '';
  res.protocol = https ? 'https' : 'http';
  res.username = user || '';
  res.password = pass || '';

  return res.toString();
};

export const nano: nanoLib.ServerScope | nanoLib.DocumentScope<any> | any = nanoLib(buildDbUrl());
