/**
 * Global ENS error suppression utility
 * This file provides utilities to suppress ENS-related errors on networks that don't support ENS
 */

/**
 * Wrap a function to suppress ENS errors
 */
export function suppressENSErrors<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      // Suppress ENS-related errors
      if (
        error.code === 'UNSUPPORTED_OPERATION' &&
        (error.operation === 'getEnsAddress' || error.message?.includes('ENS'))
      ) {
        // Return a default value or rethrow with a more user-friendly message
        console.warn('ENS not supported on this network, skipping ENS resolution');
        // Return null or undefined depending on expected return type
        return null;
      }
      throw error;
    }
  }) as T;
}

/**
 * Check if an error is ENS-related
 */
export function isENSError(error: any): boolean {
  return (
    error.code === 'UNSUPPORTED_OPERATION' &&
    (error.operation === 'getEnsAddress' || error.message?.includes('ENS'))
  );
}



