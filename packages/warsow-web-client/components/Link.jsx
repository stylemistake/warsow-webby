/**
 * Copyright (c) 2018 Aleksej Komarov
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import React from 'react';
import { connect, router, routerActions } from '../store';

function Link(props) {
  const {
    as,
    children,
    content,
    dispatch,
    routeName,
    routeParams,
    ...rest
  } = props;
  const ElementType = props.as;
  if (router && routeName && !rest.href) {
    rest.href = router.buildUrl(routeName, routeParams);
  }
  return (
    <ElementType {...rest}
      onClick={e => {
        if (routeName) {
          dispatch(routerActions.navigateTo(routeName, routeParams));
          e.preventDefault();
          return;
        }
      }}>
      {content}
      {children}
    </ElementType>
  )
}

Link.defaultProps = {
  as: 'a',
  role: 'link',
};

export default connect()(Link);
