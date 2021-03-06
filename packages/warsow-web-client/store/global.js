/**
 * Copyright (c) 2018 Aleksej Komarov
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { Map } from 'immutable';

const INITIAL_STATE = Map();

export function globalReducer(state = INITIAL_STATE, action) {
  const { type, payload } = action;

  if (type === 'DRAWER_OPEN') {
    return state.set('drawerOpened', true);
  }

  if (type === 'DRAWER_CLOSE') {
    return state.set('drawerOpened', false);
  }

  return state;
}
