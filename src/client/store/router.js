import { createRouter } from 'router5';
import browserPlugin from 'router5/plugins/browser';

export const ROUTES = [
  {
    title: 'Home',
    name: 'index',
    path: '/',
  },
  {
    title: 'Kitchen Sink',
    name: 'kitchenSink',
    path: '/kitchen-sink',
  },
  {
    title: 'Servers',
    name: 'servers',
    path: '/servers',
  },
  {
    title: 'Downloads',
    name: 'download',
    path: '/download',
  },
];

const ROUTER_OPTIONS = {
  // defaultRoute: 'index',
};

export const router = createRouter(ROUTES, ROUTER_OPTIONS)
  .usePlugin(browserPlugin());


//  Actions
// --------------------------------------------------------

import { actions as routerActions } from 'redux-router5';
import { actionTypes as routerActionTypes } from 'redux-router5';

export { routerActions };

const {
  TRANSITION_SUCCESS,
  TRANSITION_ERROR,
} = routerActionTypes;


//  Middleware
// --------------------------------------------------------

import { router5Middleware as _routerMiddleware } from 'redux-router5';

export function createRouterMiddleware() {
  return routerMiddleware;
}

function routerMiddleware(store) {
  const instance = _routerMiddleware(router)(store);

  // Workaround to properly initalize router.
  // Has to be started when Redux store has properly initialized.
  setTimeout(() => router.start());

  return next => instance(action => {
    const { type, payload } = action;
    const state = store.getState();

    // Set window title on successful transition
    if (type === TRANSITION_SUCCESS) {
      const routeName = payload.route.name;
      const routeDef = ROUTES.find(routeDef => routeDef.name === routeName);
      if (routeDef) {
        window.document.title = `Warsow - ${routeDef.title}`;
      }
    }

    // Scroll to top
    if (type === TRANSITION_SUCCESS) {
      window.scrollTo(0, 0);
    }

    // Close drawer if it was opened
    const drawerOpened = state.get('drawerOpened');
    if (drawerOpened) {
      if (type === TRANSITION_SUCCESS || type === TRANSITION_ERROR) {
        store.dispatch({
          type: 'DRAWER_CLOSE',
        });
      }
    }

    // Forward the action
    next(action);
  });
}


//  Reducer
// --------------------------------------------------------

import { composeReducers, combineReducers } from './utils.js';
import _routerReducer from 'redux-router5/immutable/reducer';

export function createRouterReducer() {
  return composeReducers([
    combineReducers({
      router: _routerReducer,
    }),
    routerTransitionReducer,
  ]);
}

// Manages various parts of state on router transitions
function routerTransitionReducer(state, action) {
  const { type, payload } = action;

  // Close drawer if it was opened
  const drawerOpened = state.get('drawerOpened');
  if (drawerOpened) {
    if (type === TRANSITION_SUCCESS || type === TRANSITION_ERROR) {
      return state.set('drawerOpened', false);
    }
  }

  return state;
}