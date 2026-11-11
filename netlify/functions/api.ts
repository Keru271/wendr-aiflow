import { buildServer } from '../../apps/api/src/server.js';

let serverInstance: any = null;

export const handler = async (event: any, context: any) => {
  if (!serverInstance) {
    serverInstance = await buildServer();
    await serverInstance.ready();
  }

  const response = await serverInstance.inject({
    method: event.httpMethod,
    url: event.path.replace('/.netlify/functions/api', '') || '/',
    headers: event.headers,
    payload: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body) : undefined,
    query: event.queryStringParameters
  });

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body
  };
};

