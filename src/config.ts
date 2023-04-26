/** @format */
import dotenv from "dotenv";
dotenv.config();
import { cleanEnv, str, port } from "envalid";

export default cleanEnv(process.env, {
	NODE_ENV: str({
		choices: ["test", "dev", "staging", "production"],
		default: "dev",
		desc: "The environment to run the server in",
		example: "production",
	}),
	PORT: port({
		default: 3000,
		devDefault: 3000,
		desc: "The port to run the server on",
		example: "3000",
	}),
});
