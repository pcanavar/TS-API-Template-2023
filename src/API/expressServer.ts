/** @format */

import express from "express";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

// Necessary for async error handling
require("express-async-errors");

// ApiError is a custom error class that can be used to send custom errors to the client
// It will automatically send a 500 error if no httpStatus is specified
// It will automatically send a "UNKOWN ERROR" message if no message is specified
// It will automatically send a errorCode if specified
class APIError extends Error {
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
	}
}

class ExpressServer {
	// Private variables
	private _app: express.Application;
	private _port: number;
	private _debug: boolean;

	constructor(port: number = 3000, debug: boolean = false) {
		this._app = express();
		this._port = port;
		this._debug = debug;
	}

	// This function is used to add things to the express app before the routes are added
	private _beforeSetup() {
		this._app.use(express.json());
		this._app.use(express.urlencoded({ extended: true }));
		this._app.use(express.static(path.resolve(".src/API/public")));
		this._app.use(express.static(path.join(__dirname, "public")));
		this._app.use(addTimestampAndDuration);
	}

	// Enables debugging mode.
	// This will log all requests to the console.
	private _setupDebug(debugOverride?: boolean): void {
		if (debugOverride !== undefined) {
			this._debug = debugOverride;
		}

		if (this._debug) {
			console.log("Debugging enabled");
			this._app.use((req, res, next) => {
				console.log(`${req.method} ${req.path}`);
				next();
			});
		}
	}

	// Will automatically add all routes in the routes folder
	private _setupRoutes() {
		console.log("\nSetting up routes\n");

		this._app.get("/", (req, res) => {
			res.send("Hello World!");
		});

		this._app.get("/healthz", (req, res) => {
			res.send({ healthz: "OK" });
		});

		const endpointsPath = fs.realpathSync(__dirname + "/endpoints");
		const files: fs.PathLike[] = getFilePathsInFolder(endpointsPath);
		const filesAndRelativePaths: RelativaPaths[] = getRelativePaths(
			files,
			endpointsPath,
		);

		for (const endpoint of filesAndRelativePaths) {
			const router = require(endpoint.dir.toString()).default;

			if (typeof router === "function") {
				this._app.use(endpoint.formattedPath, router);
				console.log(`	• Loaded ${endpoint.endpoint}`);
			} else {
				console.error(`Endpoint ${endpoint.relativeDir} is invalid`);
			}
		}
		console.log("\nRoutes registered\n");
	}

	// This function is used to add things to the express app after the routes are added
	// Examples of things that can be added here are error handlers and 404 page
	private _afterSetup() {
		this._app.use((req: Request, res: Response) => {
			res.status(404).sendFile(
				path.resolve("./src/API/templates/404.html"),
			);
		});

		this._app.use(
			(error: Error, req: Request, res: Response, next: NextFunction) => {
				if (error instanceof APIError) {
					res.status(error.httpStatus).json({
						...error,
					});
				} else {
					res.status(500).json({
						message: "Unkown Error",
						status: 500,
					});
				}
			},
		);
	}

	// Listens for requests on the specified port
	private _listen(): void {
		this._app.listen(this._port, () => {
			console.log(`Server running at http://localhost:${this._port}`);
		});
	}

	/**
	 * @description Starts the express server
	 * @param debug If true, will enable debugging mode and log all requests to the console
	 */
	public start(debug?: boolean): void {
		this._beforeSetup();
		this._setupDebug(debug);
		this._setupRoutes();
		this._afterSetup();
		this._listen();
	}

	/**
	 * @returns The express app
	 */

	public getApp(): express.Application {
		return this._app;
	}

	/**
	 *
	 * @returns The express router
	 */
	public getRouter(): express.Router {
		return express.Router();
	}

	/**
	 *
	 * @param originalFileName The original file name (__filename)
	 * @returns The endpoint name
	 */
	public getEndpointNameFromPath(originalFileName: string): string {
		const filename = path.basename(
			originalFileName,
			path.extname(originalFileName),
		);
		const filePath = `/${filename}`;
		return filePath;
	}
}

const expressServer = new ExpressServer();

export default expressServer;
export { APIError };

/**
 *
 * @param basePath Path to be used for the search of files
 * @returns Array of paths to files
 */
function getFilePathsInFolder(basePath: fs.PathLike): fs.PathLike[] {
	const files: fs.PathLike[] = [];

	for (const folderOrFileEntry of fs.readdirSync(basePath, {
		withFileTypes: false,
	})) {
		const folderOrFileEntryPath = path.join(
			basePath.toString(),
			folderOrFileEntry.toString(),
		);

		if (fs.statSync(folderOrFileEntryPath).isFile()) {
			files.push(folderOrFileEntryPath);
		} else if (fs.statSync(folderOrFileEntryPath).isDirectory()) {
			const filesInCurrentFolder = getFilePathsInFolder(
				folderOrFileEntryPath,
			);
			files.push(...filesInCurrentFolder);
		}
	}

	return files;
}

// This is the interface for the relative paths
// It is used to store the relative path, the file name, the file extension and the endpoint
interface RelativaPaths {
	dir: fs.PathLike;
	relativeDir: fs.PathLike;
	fileWithExtension: string;
	file: string;
	fileExtension: string;
	formattedPath: string;
	endpoint: string;
}

/**
 *
 * @param pathArray Array of paths to be converted to relative paths
 * @param basePath Path to be used as the base path
 * @returns Array of relative paths
 */
function getRelativePaths(
	pathArray: fs.PathLike[],
	basePath: fs.PathLike,
): RelativaPaths[] {
	const relativePaths: RelativaPaths[] = [];

	for (const eachPath of pathArray) {
		const resultRelativePath = path.relative(
			basePath.toString(),
			eachPath.toString(),
		);

		const { name, ext, base, dir } = path.parse(resultRelativePath);

		const formattedPath = `/${dir.replace(/\\/g, "/")}`;

		relativePaths.push({
			dir: eachPath,
			file: name,
			fileExtension: ext,
			fileWithExtension: base,
			relativeDir: resultRelativePath,
			formattedPath: formattedPath,
			endpoint: `${
				formattedPath == "/" ? "" : formattedPath
			}/${name}`.replace(/\s/g, "_"),
		});
	}
	return relativePaths;
}

// Middleware to add a timestamp and duration to the response body
// This is used to calculate the time taken to process the request
// This is useful for debugging and performance testing
function addTimestampAndDuration(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const start = process.hrtime(); // get the current high-resolution time

	const originalJson = res.json.bind(res);
	res.json = function (body): Response {
		const end = process.hrtime(); // get the high-resolution time after processing the request

		const duration = parseFloat(
			(
				(end[0] * 1000 +
					end[1] / 1000000 -
					start[0] * 1000 -
					start[1] / 1000000) /
				1000
			).toFixed(2),
		); // calculate the duration in seconds

		const unixTimestamp = Math.floor(Date.now() / 1000);
		const jsonBody = {
			...body,
			unixTimestamp: unixTimestamp,
			duration: duration,
		};
		return originalJson(jsonBody);
	};
	next();
}
