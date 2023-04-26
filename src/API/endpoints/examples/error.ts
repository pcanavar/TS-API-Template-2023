/** @format */

import api from "@api";
import ApiError from "@apierror";

const router = api.getRouter();
const pathFromFileName = api.getPathFromFileName(__filename);

/**
 *
 * This is an example error endpoint.
 * You can access it by going to http://localhost:3000/examples/error or using the private docs.
 * It will automatically detect the ApiError and send a JSON response with the details in it.
 *
 * @api {get} /examples/error Example Error
 * @apiVersion 1.0.0
 * @apiName ErrorApi
 * @apiGroup All
 * @apiPrivate
 *
 */

router.get(pathFromFileName, (req, res) => {
	throw new ApiError({
		httpStatus: 418,
		message:
			"The server refuses to brew coffee because it is, permanently, a teapot",
		errorCode: "ERROR_CODE",
	});
});

export default router;
