/** @format */

import api from "@api";

const router = api.getRouter();
const pathFromFileName = api.getPathFromFileName(__filename);

/**
 * This is an example endpoint.
 * You can access it by going to http://localhost:3000/examples/endpoint or using the docs.
 * Using getPathFromFileName will automatically get the endpoint name from the file name.
 *
 * @api {get} /examples/endpoint Example Get Endpoint
 * @apiVersion 1.0.0
 * @apiName GetApi
 * @apiGroup All
 *
 */
router.get(pathFromFileName, (req, res) => {
	res.status(200).json({ hello: "world" });
});

export default router;
