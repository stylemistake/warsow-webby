/**
 * Copyright (c) 2018 Aleksej Komarov
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import { promisify } from 'util';
import config from 'warsow-common/config';
import { createLogger } from 'warsow-common/logger';

const logger = createLogger('auth');

let authSecretBuf;

export async function setupAuth() {
  const secretPath = 'storage/authSecret.key';
  try {
    authSecretBuf = await promisify(fs.readFile)(secretPath);
    logger.log(`Loaded secret from '${secretPath}'`);
  }
  catch (err) {
    if (err.code === 'ENOENT') {
      // Generate a new key
      logger.log(`Generating a new ${config.AUTH_SECRET_SIZE} byte secret`);
      authSecretBuf = await randomBuffer(config.AUTH_SECRET_SIZE);
      await promisify(fs.writeFile)(secretPath, authSecretBuf);
      logger.log(`Saved secret to '${secretPath}'`);
    }
    else {
      throw err;
    }
  }
}

async function randomBuffer(size) {
  return await promisify(crypto.randomFill)(Buffer.alloc(size));
}

export async function createToken(iss, aud, { longTerm = false } = {}) {
  const payload = { iss, aud };
  const options = {
    algorithm: 'HS256',
    expiresIn: longTerm
      ? '1 year'
      : '10 minutes',
  };
  return await promisify(jwt.sign)(payload, authSecretBuf, options);
}

export async function verifyToken(token, aud) {
  const options = {
    algorithms: ['HS256'],
  };
  const payload = await promisify(jwt.verify)(token, authSecretBuf, options);
  logger.log('decoded payload', payload);
  if (payload.aud !== aud) {
    logger.log(`invalid audience, expected '${aud}', got '${payload.aud}'`);
  }
  return payload;
}
