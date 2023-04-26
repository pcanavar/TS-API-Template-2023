/** @format */

import api from "@api";

const router = api.getRouter();
const pathFromFileName = api.getPathFromFileName(__filename);

// This is an example endpoint
// You can access it by going to http://localhost:3000/examples/endpoint
// Using getPathFromFileName will automatically get the endpoint name from the file name

router.get(pathFromFileName, (req, res) => {
	res.send("Hello World!");
});

export default router;
