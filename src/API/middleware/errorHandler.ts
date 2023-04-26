/** @format */
import { Request, Response, NextFunction } from "express";
import ApiError from "@apierror";

export default (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (error instanceof ApiError) {
		res.status(error.httpStatus).json({
			...error,
		});
	} else {
		res.status(500).json({
			message: "Unkown Error",
			status: 500,
		});
	}
};
