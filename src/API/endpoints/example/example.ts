/** @format */

import api, { APIError } from "@api";
const router = api.getRouter();

// This is an example endpoint
// You can access it by going to http://localhost:3000/example/example
// Using getEndpointNameFromPath will automatically get the endpoint name from the file name

router.get(api.getEndpointNameFromPath(__filename), (req, res) => {
	res.send("Hello World!");
});

// This is an example error endpoint
// You can access it by going to http://localhost:3000/example/error
// It will automatically send a 400 error with the message and the errorCode from the object, all optional.
router.get("/error", async () => {
	// This is just to simulate a delay of 1 second
	await new Promise((resolve) => setTimeout(resolve, 1000));

	throw new APIError({
		httpStatus: 400,
		message: "This is an error",
		errorCode: "ERROR_CODE",
	});
});

export default router;
