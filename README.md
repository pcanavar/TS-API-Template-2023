<!-- @format -->

# Example TS API

This is a simple API Template/Boilerplate to help with the deploy of new
API/Microservices

## Run Locally

Clone the project And Go to the project directory.

Install dependencies

```bash
  yarn install
```

Start the server

```bash
  yarn dev
```

## Features

- Auto Load of endpoints using the folder structure in ./src/API/endpoints
    using routes.
- Handles errors using a new ApiError class which extends Error. Will let add
    custom status codes to erros dynamically and messages/codes.
- Adds unixTimestamp and duration to all responses that are JSON.
- Handles pages not found with a html 404 page template
- Healthz endpoint for easy cluster deployment.
