// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeError = <C extends Record<string, (...args: any[]) => string>>(
	Class: typeof Error,
	codes: C
) => {
	class RankedError<T extends keyof C> extends Class {
		public constructor(public code: T, ...params: Parameters<C[T]>) {
			super(codes[code](...params));
		}

		get name() {
			return `${super.name} [${this.code}]`;
		}
	}
	return RankedError;
};

export const ErrorMessages = {
	PROPERTY_DOESNT_EXIST:
		(path: string[], current: string): string => `Property ${current} doesn't exist on ${path.join('.')}`
};

export type ErrorMessages = typeof ErrorMessages;

export type ErrorCode = keyof ErrorMessages;

const _Error = makeError(Error, ErrorMessages);
const _TypeError = makeError(TypeError, ErrorMessages);

export {
	_Error as Error,
	_TypeError as TypeError
};