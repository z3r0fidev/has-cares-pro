import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
// Next.js 16 Proxy convention
export default createMiddleware(routing);
 
export function proxy(request: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return createMiddleware(routing)(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(es|en|ar)/:path*']
};
