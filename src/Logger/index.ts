/** @format */

import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/**
 * Custom Filter Levels
 */

// Info & warn

const infoAndWarnFilter = winston.format((info) => {
	return info.level === "info" || info.level === "warn" ? info : false;
});

// Error

const errorFilter = winston.format((info) => {
	return info.level === "error" ? info : false;
});

// API

const apiFilter = winston.format((info) => {
	return info.level === "api" ? info : false;
});

// Debug

const debugFilter = winston.format((info) => {
	return info.level === "debug" ? info : false;
});

/**
 * Custom Formatter
 */

// Console Print

const consoleFormat = winston.format.printf((info) => {
	return `${new Date().toUTCString()} ${info.level}: ${
		info.stack || info.message
	}`;
});

// File Logs

const logFormat = winston.format.printf((info) => {
	if ("stack" in info) {
		var stack = info.stack;
	}

	try {
		var stringfied = JSON.stringify(info, null, 2);
		return `${new Date().toUTCString()} ${info.level}: ${
			info.message
		}\n${stringfied}`;
	} catch (error) {
		return `${new Date().toUTCString()} ${info.level}: ${info.message}\n${
			stack ? stack : ""
		}`;
	}
});

// Custom Levels

const customLevels = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		api: 3,
		debug: 4,
		all: 5,
	},

	colors: {
		error: "black redBG",
		warn: "black yellowBG",
		info: "bold cyan",
		api: "white blueBG",
		debug: "bold grey whiteBG",
		all: "black greenBG",
	},
};

const logToFileFormat = winston.format.combine(
	winston.format.align(), // Enables easy reading
	winston.format.errors({ stack: true }),
	logFormat,
);

const consolePrintFormat = winston.format.combine(
	winston.format.errors({ stack: true }),
	consoleFormat,
);
winston.addColors(customLevels.colors);

const logger = winston.createLogger({
	levels: customLevels.levels,
	format: consoleFormat,
	exitOnError: false,
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				consolePrintFormat,
			),
			level: "all",
		}),
		new winston.transports.File({
			filename: "./logs/errors.log",
			level: "error",
			format: winston.format.combine(errorFilter(), logToFileFormat),
		}),
		new DailyRotateFile({
			filename: "./logs/%DATE% - warn-info.log",
			datePattern: "YYYY-MM-DD",
			//zippedArchive: true,
			level: "info",
			format: winston.format.combine(
				infoAndWarnFilter(),
				logToFileFormat,
			),
		}),
		new DailyRotateFile({
			filename: "./logs/%DATE% - api.log",
			datePattern: "YYYY-MM-DD",
			//zippedArchive: true,
			level: "api",
			format: winston.format.combine(apiFilter(), logToFileFormat),
		}),
		new DailyRotateFile({
			filename: "./logs/%DATE% - debug.log",
			datePattern: "YYYY-MM-DD",
			//zippedArchive: true,
			level: "debug",
			format: winston.format.combine(debugFilter(), logToFileFormat),
		}),
		new DailyRotateFile({
			filename: "./logs/%DATE% - general.log",
			datePattern: "YYYY-MM-DD",
			//zippedArchive: true,
			level: "debug",
		}),
	],
});

class Logger {
	public info(message: string, details?: any) {
		logger.log("info", message, details);
	}

	public error(message: string, details?: any) {
		logger.log("error", message, details);
	}

	public warn(message: string, details?: any) {
		logger.log("warn", message);
	}

	public api(message: string, details?: any) {
		logger.log("api", message, details);
	}

	public debug(message: string, details?: any) {
		logger.log("debug", message, details);
	}

	public all(message: string, details?: any) {
		logger.log("all", message, details);
	}
}

export default new Logger();
