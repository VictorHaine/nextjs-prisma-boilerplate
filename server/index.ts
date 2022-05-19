import express from 'express';
import { createServer } from 'https';
import { createServer as createServerHttp } from 'http';
import fs from 'fs';
import next from 'next';
import getConfig from 'next/config';

const isDev = !['production', 'test'].includes(process.env.NODE_ENV);
const app = next({ dev: isDev });
const handle = app.getRequestHandler();
const server = express();

// vars from .env.* files are available inside prepare()
app.prepare().then(() => {
  server.use('/uploads', express.static(__dirname + '/../uploads'));

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const port = parseInt(process.env.PORT || '3001', 10);
  const isHttps = process.env.PROTOCOL === 'https';

  if (isHttps) {
    const httpsOptions = {
      key: fs.readFileSync(__dirname + '/../certs/localhost-key.pem'),
      cert: fs.readFileSync(__dirname + '/../certs/localhost.pem'),
    };
    createServer(httpsOptions, server).listen(port);
  } else {
    createServerHttp(server).listen(port);
  }

  // tslint:disable-next-line:no-console
  console.log(
    `> NODE_ENV=${process.env.NODE_ENV}\n> Server listening at ${
      isHttps ? 'https' : 'http'
    }://${process.env.HOSTNAME}:${port} as ${process.env.NODE_ENV}, dev mode:${isDev}`
  );

  printLoadedEnvVariables();
});

// this should be in logger
// must be here, cannot import in production
function printLoadedEnvVariables() {
  const { serverRuntimeConfig } = getConfig();
  const separator = '--------------';

  const vars = {
    '-node': separator,
    NODE_ENV: requiredEnv('NODE_ENV'),
    PORT: requiredEnv('PORT'),
    'env-buildime': separator,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_POSTS_PER_PAGE: process.env.NEXT_PUBLIC_POSTS_PER_PAGE,
    NEXT_PUBLIC_USERS_PER_PAGE: process.env.NEXT_PUBLIC_USERS_PER_PAGE,
    NEXT_PUBLIC_DEFAULT_THEME: process.env.NEXT_PUBLIC_DEFAULT_THEME,
    '.env': separator,
    PROTOCOL: process.env.PROTOCOL,
    HOSTNAME: process.env.HOSTNAME,
    NEXTAUTH_URL: requiredEnv('NEXTAUTH_URL'),
    '.env.local-db': separator,
    // POSTGRES_USER: process.env.POSTGRES_USER,
    // POSTGRES_HOSTNAME: process.env.POSTGRES_HOSTNAME,
    // POSTGRES_PORT: process.env.POSTGRES_PORT,
    // POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    // POSTGRES_DB: process.env.POSTGRES_DB,
    DATABASE_URL: requiredEnv('DATABASE_URL'),
    '-serverRuntimeConfig': separator,
    SECRET: serverRuntimeConfig.SECRET,
    FACEBOOK_CLIENT_ID: serverRuntimeConfig.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: serverRuntimeConfig.FACEBOOK_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: serverRuntimeConfig.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: serverRuntimeConfig.GOOGLE_CLIENT_SECRET,
  };

  const fn = (_key: string, value: string) => (value === undefined ? null : value);
  const str = JSON.stringify(vars, fn, 2);

  // print object
  const str1 = str
    .replace(/(^\s+|{)/gm, '')
    .replace(/(,|}|\s+$)/gm, '')
    .replace(/"/gm, '');

  console.log('Loaded env vars: ', str1);
}

function requiredEnv(envName: string): string {
  if (!(envName in process.env)) {
    throw new Error(`process.env.${envName} is not set on app start`);
  }
  if (!process.env[envName]) {
    throw new Error(`process.env.${envName} is set but empty on app start`);
  } else {
    return process.env[envName] as string;
  }
}
