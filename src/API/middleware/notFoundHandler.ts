/** @format */
import { Request, Response } from "express";
import path from "path";

export default (req: Request, res: Response) => {
	res.status(404).sendFile(path.resolve("./src/API/templates/404.html"));
};
