/** @format */

import log from "@log";

// ApiError is a custom error class that can be used to send custom errors to the client
// It will automatically send a 500 error if no httpStatus is specified
// It will automatically send a "UNKOWN ERROR" message if no message is specified
// It will automatically send a errorCode if specified
class ApiError extends Error {
	public readonly message: string;
	public readonly httpStatus: number;
	public readonly userMessage: string;
	public readonly errorCode?: string;

	constructor(errorObj: {
		message?: string;
		httpStatus?: number;
		errorCode?: string;
	}) {
		super(errorObj.message);
		this.message = errorObj.message ?? "UNKOWN ERROR";
		this.userMessage = errorObj.message ?? "UNKOWN ERROR";
		this.httpStatus = errorObj.httpStatus ?? 500;
		this.errorCode = errorObj.errorCode;
		log.error(this.message, this);
	}
}

export default ApiError;
export { ApiError };
