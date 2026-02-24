import {
  type ActionFunction,
  json,
  type LoaderFunction,
  redirect,
} from '@shopify/remix-oxygen';

import {isLocalPath} from '~/lib/utils';
import {notFound} from '~/lib/utils';

const ROOT_PATH = '/' as const;

// Add CORS headers helper
function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || 'http://localhost:3333',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS preflight requests
export const options = async ({request}: {request: Request}) => {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
};

/**
 * A `POST` request to this route will exit preview mode
 */
export const action: ActionFunction = async ({request, context}) => {
  const {preview} = context.sanity;

  if (!(request.method === 'POST' && preview?.session)) {
    return json({message: 'Method not allowed'}, 405);
  }

  const body = await request.formData();
  const slug = (body.get('slug') as string) ?? ROOT_PATH;
  const redirectTo = isLocalPath(request, slug) ? slug : ROOT_PATH;

  const origin = request.headers.get('Origin');

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await preview.session.destroy(),
      ...corsHeaders(origin),
    },
  });
};

/**
 * A `GET` request to this route will enter preview mode
 */
export const loader: LoaderFunction = async function ({request, context}) {
  const {env, sanity} = context;

  if (!sanity.preview?.session) {
    return notFound();
  }

  const {searchParams} = new URL(request.url);

  const secret =
    searchParams.get('secret') || searchParams.get('sanity-preview-secret');

  // if (!secret) {
  //   throw new MissingSecretError();
  // }

  // if (secret !== env.SANITY_PREVIEW_SECRET) {
  //   throw new InvalidSecretError();
  // }

  const slug =
    searchParams.get('slug') ||
    searchParams.get('sanity-preview-pathname') ||
    ROOT_PATH;
  const redirectTo = isLocalPath(request, slug) ? slug : ROOT_PATH;

  sanity.preview.session.set('projectId', env.SANITY_PROJECT_ID);
  sanity.preview.session.set('workspace', 'production');

  const origin = request.headers.get('Origin');
  const cookie = await sanity.preview.session.commit();

  return redirect(redirectTo, {
    status: 307,
    headers: {
      'Set-Cookie': cookie,
      ...corsHeaders(origin),
    },
  });
};

class MissingSecretError extends Response {
  constructor() {
    super('Missing secret', {status: 401, statusText: 'Unauthorized'});
  }
}

class InvalidSecretError extends Response {
  constructor() {
    super('Invalid secret', {status: 401, statusText: 'Unauthorized'});
  }
}
