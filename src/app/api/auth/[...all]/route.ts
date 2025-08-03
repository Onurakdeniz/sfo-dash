import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

// Add CORS headers to the responses
const addCorsHeaders = (response: Response) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
};

export async function GET(request: Request) {
  const response = await handler.GET(request);
  return addCorsHeaders(response);
}

export async function POST(request: Request) {
  const response = await handler.POST(request);
  return addCorsHeaders(response);
}

export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  return addCorsHeaders(response);
}
