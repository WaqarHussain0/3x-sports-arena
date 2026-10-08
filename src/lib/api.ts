import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import { connectDB } from './db';
import { isValidObjectId, type FieldErrors } from './validators';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OVERLAP'
  | 'DUPLICATE'
  | 'INTERNAL_ERROR';

/** Throw from services/handlers; turned into a JSON error response by `handleError`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: ErrorCode = 'BAD_REQUEST',
    public fields?: FieldErrors,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string, fields?: FieldErrors) =>
  new ApiError(400, message, fields ? 'VALIDATION_ERROR' : 'BAD_REQUEST', fields);
export const notFound = (what = 'Resource') => new ApiError(404, `${what} not found`, 'NOT_FOUND');
export const conflict = (message: string, details?: Record<string, unknown>) =>
  new ApiError(409, message, 'CONFLICT', undefined, details);

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json(
    { success: true, data, ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200 },
  );
}

export function fail(
  status: number,
  message: string,
  code: ErrorCode,
  fields?: FieldErrors,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { success: false, error: { message, code, ...(fields ? { fields } : {}), ...(details ?? {}) } },
    { status },
  );
}

const DUPLICATE_MESSAGES: Record<string, string> = {
  name: 'A court with this name already exists.',
  nameLower: 'A category with this name already exists.',
  email: 'This email is already in use.',
  phone: 'A customer with this phone number already exists.',
};

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.status, error.message, error.code, error.fields, error.details);
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const fields: FieldErrors = {};
    for (const [path, err] of Object.entries(error.errors)) fields[path] = err.message;
    return fail(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', fields);
  }
  if (error instanceof mongoose.Error.CastError) {
    return fail(400, `Invalid value for ${error.path}`, 'BAD_REQUEST');
  }
  if (error instanceof mongoose.Error.VersionError) {
    return fail(409, 'This record was changed by someone else. Please reload and try again.', 'CONFLICT');
  }
  const mongoErr = error as { code?: number; keyPattern?: Record<string, unknown> };
  if (mongoErr?.code === 11000) {
    const key = Object.keys(mongoErr.keyPattern ?? {})[0] ?? '';
    return fail(409, DUPLICATE_MESSAGES[key] ?? 'This record already exists.', 'DUPLICATE');
  }
  console.error('[api] Unhandled error', error);
  return fail(500, 'Something went wrong. Please try again.', 'INTERNAL_ERROR');
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
}

export function assertObjectId(id: string, what = 'id'): string {
  if (!isValidObjectId(id)) throw badRequest(`Invalid ${what}`);
  return id;
}

type RouteParams = Record<string, string | string[] | undefined>;

export interface AuthedContext<P extends RouteParams> {
  params: P;
  adminId: string;
}

/**
 * Wraps a route handler: requires a valid session, connects to the DB, injects `adminId`,
 * and converts thrown errors into the standard error envelope.
 */
export function withAuth<P extends RouteParams = Record<string, never>>(
  handler: (req: NextRequest, ctx: AuthedContext<P>) => Promise<Response>,
) {
  return async (req: NextRequest, context: { params: Promise<P> }): Promise<Response> => {
    try {
      const session = await auth();
      const adminId = session?.user?.id;
      if (!adminId) return fail(401, 'You must be signed in.', 'UNAUTHORIZED');
      await connectDB();
      const params = (await context?.params) ?? ({} as P);
      return await handler(req, { params, adminId });
    } catch (error) {
      return handleError(error);
    }
  };
}
