/** @format */

import api from "@api";
import ApiError from "@apierror";

const router = api.getRouter();
const pathFromFileName = api.getPathFromFileName(__filename);

/**
 *
 * This is an example error endpoint
 * You can access it by going to http://localhost:3000/examples/error
 * It will automatically send a 400 error with the message and the errorCode from the object, all optional.
 *
 * @api {get} /examples/error Example Error
 * @apiVersion 1.0.0
 * @apiName ErrorApi
 * @apiGroup All
 * @apiPrivate
 */

router.get(pathFromFileName, (req, res) => {
	throw new ApiError({
		httpStatus: 418,
		message: "This is an error",
		errorCode: "ERROR_CODE",
	});
});

export default router;
