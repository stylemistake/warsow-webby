/**
 * Copyright (c) 2018 Aleksej Komarov
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/**
 * Platform-agnostic EventEmitter class
 */
export class EventEmitter {

  constructor() {
    this.listeners = {};
  }

  on(name, listener) {
    this.listeners[name] = this.listeners[name] || [];
    this.listeners[name].push(listener);
  }

  off(name, listener) {
    const listeners = this.listeners[name];

    if (!listeners) {
      throw new Error(`There is no listeners for "${name}"`);
    }

    this.listeners[name] = listeners
      .filter((existingListener) => {
        return existingListener !== listener;
      });
  }

  emit(name, ...params) {
    const listeners = this.listeners[name];

    if (!listeners) {
      return;
    }

    for (let i = 0, len = listeners.length; i < len; i += 1) {
      const listener = listeners[i];
      listener(...params);
    }
  }

  clear() {
    this.listeners = {};
  }

}
