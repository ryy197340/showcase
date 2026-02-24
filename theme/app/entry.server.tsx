// On the server side, useLayoutEffect is never executed but generates a warning.
// https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
import React from 'react';
if (typeof window === 'undefined') React.useLayoutEffect = React.useEffect;

import {RemixServer} from '@remix-run/react';
import type {AppLoadContext, EntryContext} from '@shopify/remix-oxygen';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext,
) {
  const projectId = loadContext.env.SANITY_PROJECT_ID;

  const cspDirectives = {
    'default-src': [
      "'self'",
      'https://cdn.sanity.io',
      'https://lh3.googleusercontent.com',
    ],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'http://localhost:3333',
      'https://cdn.shopify.com',
      'https://assets.videowise.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.sanity.io',
    ],
    'connect-src': [
      "'self'",
      `https://${projectId}.api.sanity.io`,
      `wss://${projectId}.api.sanity.io`,
      'http://localhost:3000',
      'http://localhost:3333',
      'ws://localhost:8002',
    ],
    'frame-src': [
      'http://localhost:3333',
      'https://*.sanity.studio',
      'https://sanity.io',
    ],
    'frame-ancestors': [
      "'self'",
      'http://localhost:3000',
      'http://localhost:3333',
      'https://*.sanity.studio',
      'https://sanity.io',
    ],
    'img-src': ["'self'", 'data:', 'https://cdn.sanity.io'],
    'base-uri': ["'self'"],
  };

  const cspHeader = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  // responseHeaders.set('Content-Security-Policy', cspHeader);
  const body = await renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set(
    'Access-Control-Allow-Origin',
    'https://extensions.shopifycdn.com',
  );
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
