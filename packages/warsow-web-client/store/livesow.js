/**
 * Copyright (c) 2018 Aleksej Komarov
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { fromJS } from 'immutable';
import { EventEmitter } from 'warsow-common/events';
import LZString from 'warsow-common/lz-string';

const USE_LZ_STRING = false;

function getWsUrl(path) {
  const origin = new URL(window.location.href).origin;
  return origin.replace('http', 'ws') + path;
}

export function createLivesowMiddleware() {
  return livesowMiddleware;
}

function livesowMiddleware(store) {
  const client = new LivesowClient();

  // Let livesow know we are ready
  client.onConnect(() => {
    if (USE_LZ_STRING) {
      client.ws.send(Buffer.from(JSON.stringify({
        type: 'ACCEPT_LZ_STRING',
        payload: null,
        time: Date.now(),
      })));
    }
    client.ws.send(Buffer.from(JSON.stringify({
      type: 'INTERVAL',
      payload: { interval: 5000 },
      time: Date.now(),
    })));
    client.ws.send(Buffer.from(JSON.stringify({
      type: 'READY',
      payload: null,
      time: Date.now(),
    })));
  });

  // Dispatch livesow messages as redux actions
  client.onUpdate(msg => {
    // Handle UPDATE as a stream of separate messages
    if (msg.type === 'UPDATE') {
      for (let msg of msg.payload) {
        // Append livesow namespace
        msg.type = `LIVESOW_${msg.type || msg.action}`;
        // Dispatch action
        store.dispatch(msg);
      }
      return;
    }
    // Append livesow namespace
    msg.type = `LIVESOW_${msg.type}`;
    // Dispatch action
    store.dispatch(msg);
  });

  return next => action => {
    const { type, payload } = action;

    if (type === 'LIVESOW_START') {
      const url = getWsUrl('/livesow');
      client.connect(url);
    }

    if (type === 'LIVESOW_STOP') {
      client.disconnect();
    }

    next(action);
  };
}

export function livesowReducer(state, action) {
  const { type, payload } = action;

  if (type === 'LIVESOW_INIT') {
    return state.set('livesow', fromJS(payload));
  }

  //  Servers
  // ------------------------------------------------------

  if (type === 'LIVESOW_SERVER_ADD') {
    return state.updateIn(['livesow', 'servers'], servers => {
      return servers.push(fromJS(payload));
    });
  }

  if (type === 'LIVESOW_SERVER_UPDATE') {
    return state.updateIn(['livesow', 'servers'], servers => {
      const index = servers.findIndex(x => x.get('id') === payload.id)
      if (index === -1) {
        console.log('livesow:reducer', 'did not find server object', action);
        return servers;
      }
      return servers.set(index, servers.get(index).merge(payload));
    });
  }

  if (type === 'LIVESOW_SERVER_DELETE') {
    return state.updateIn(['livesow', 'servers'], servers => {
      const index = servers.findIndex(x => x.get('id') === payload.id);
      if (index === -1) {
        console.log('livesow:reducer', 'did not find server object', action);
        return servers;
      }
      return servers.delete(index);
    });
  }

  //  Players
  // ------------------------------------------------------

  if (type === 'LIVESOW_PLAYER_ADD') {
    return state.updateIn(['livesow', 'players'], players => {
      return players.push(fromJS(payload));
    });
  }

  if (type === 'LIVESOW_PLAYER_UPDATE') {
    return state.updateIn(['livesow', 'players'], players => {
      const index = players.findIndex(x => x.get('id') === payload.id)
      if (index === -1) {
        console.log('livesow:reducer', 'did not find player object', action);
        return players;
      }
      return players.set(index, players.get(index).merge(payload));
    });
  }

  if (type === 'LIVESOW_PLAYER_DELETE') {
    return state.updateIn(['livesow', 'players'], players => {
      const index = players.findIndex(x => x.get('id') === payload.id);
      if (index === -1) {
        console.log('livesow:reducer', 'did not find player object', action);
        return players;
      }
      return players.delete(index);
    });
  }

  return state;
}

export class LivesowClient {

  constructor() {
    this.emitter = new EventEmitter();
  }

  connect(uri) {
    if (this.ws) {
      throw new Error(`Already connected to '${this.ws.url}'!`);
    }
    this.ws = new WebSocket(uri, ['v1']);
    this.ws.onopen = e => {
      console.log('ws:open', e);
      this.emitter.emit('connect');
    }
    this.ws.onmessage = e => {
      let msg = e.data;
      if (USE_LZ_STRING) {
        msg = LZString.decompressFromBase64(msg);
      }
      msg = JSON.parse(msg);
      console.log('ws:message', msg);
      this.emitter.emit('update', msg);
    };
    return this;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    return this;
  }

  onConnect(fn) {
    this.emitter.on('connect', fn);
    return this;
  }

  onUpdate(fn) {
    this.emitter.on('update', fn);
    return this;
  }

}
