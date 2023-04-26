/** @format */

import log from "@log";
import figletLogo from "@templates/figletLogo";
import errorHandler from "@middleware/errorHandler";
import notFoundHandler from "@API/middleware/notFoundHandler";
import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import cors from "cors";
import path from "path";

/**
 * Necessary for async error handling
 */
require("express-async-errors");

class ExpressServer {
	private _app: express.Application;
	private _port: number;
	private _debug: boolean;

	constructor(port: number = 3000, debug: boolean = false) {
		this._app = express();
		this._port = port;
		this._debug = debug;
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
	public getPathFromFileName(originalFileName: string): string {
		const filename = path.parse(originalFileName).name;
		const filePath = `/${filename}`;
		return filePath;
	}

	/**
	 * This function is used to add things to the express app before the routes are added
	 */
	private _beforeSetup() {
		this._app.use(express.json());
		this._app.use(cors());
		this._app.use(express.urlencoded({ extended: true }));
		this._app.use(express.static(path.join(__dirname, "public")));
		this._app.use(addTimestampAndDuration);
	}

	/**
	 * Enables debugging mode.
	 * This will log all requests to the console.
	 * @param debugOverride Enables debugging mode if true
	 */
	private _setupDebug(debugOverride?: boolean): void {
		if (debugOverride !== undefined) {
			this._debug = debugOverride;
		}

		if (this._debug) {
			log.debug("Debugging enabled");
			this._app.use((req, res, next) => {
				log.debug(`${req.method} ${req.path}`);
				next();
			});
		}
	}

	/**
	 * Will automatically add all routes in the routes folder
	 */
	private _setupRoutes() {
		log.info("Loading ./endpoints files:");

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
				log.info(`	• Loaded ${endpoint.endpoint}`);
			} else {
				log.error(`Endpoint ${endpoint.relativeDir} is invalid`);
			}
		}
		log.info("Loading Complete");
	}

	/**
	 * This function is used to add things to the express app after the routes are added
	 * Examples of things that can be added here are error handlers and 404 page
	 */
	private _afterSetup() {
		this._app.use(notFoundHandler);
		this._app.use(errorHandler);
	}

	/**
	 * Listens for requests on the specified port
	 */
	private _listen(): void {
		this._app.listen(this._port, () => {
			log.info(figletLogo(this._port));
		});
	}
}

const expressServer = new ExpressServer();

export default expressServer;

/**
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

/**
 * This is the interface for the relative paths
 * It is used to store the relative path, the file name, the file extension and the endpoint
 */
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

/**
 * Middleware to add a timestamp and duration to the response body
 * This is used to calculate the time taken to process the request
 * This is useful for debugging and performance testing
 */
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
