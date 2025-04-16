![tw-banner](https://github.com/thirdweb-example/vite-starter/assets/57885104/cfe2164b-b50b-4d8e-aaaa-31331da2d647)

# vite-starter

Starter template to build onchain applications with [thirdweb](https://thirdweb.com) and [vite](https://vitejs.dev/). 

## Features 

- thirdweb & vite pre-installed and configured to reduce setup steps
- ConnectButton to onboard users to your application

## Installation

Install the template using [thirdweb create](https://portal.thirdweb.com/cli/create)

```bash
  npx thirdweb create app --vite
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file:

`CLIENT_ID`

To learn how to create a client ID, refer to the [client documentation](https://portal.thirdweb.com/typescript/v5/client). 

## Run locally

Install dependencies

```bash
yarn
```

Start development server

```bash
yarn dev
```

Create a production build

```bash
yarn build
```

Preview the production build

```bash
yarn preview
```

## Proxy Server for Thirdweb API

This proxy server allows frontend application to communicate with the Thirdweb API without encountering CORS issues.

### Why is this needed?

When making direct API requests from a browser-based application to a different domain (like thirdweb.com), browsers enforce Cross-Origin Resource Sharing (CORS) restrictions. The Thirdweb API doesn't include the necessary CORS headers to allow direct requests from local development server.

### How to use

1. Start the proxy server:

```bash
yarn proxy-server
```

This will start the proxy server at http://localhost:3000.

2. In frontend code, make requests to the proxy server instead of directly to Thirdweb:

```typescript
// Instead of making direct requests to thirdweb.com:
axios.post('http://localhost:3000/api/create-project', data)
```

The proxy server will:
- Handle authentication headers and cookies
- Forward request to Thirdweb
- Return the response to frontend application
