# Proxy Server for Thirdweb API

This proxy server allows frontend application to communicate with the Thirdweb API without encountering CORS issues.

## Why is this needed?

When making direct API requests from a browser-based application to a different domain (like thirdweb.com), browsers enforce Cross-Origin Resource Sharing (CORS) restrictions. The Thirdweb API doesn't include the necessary CORS headers to allow direct requests from local development server.

## How to use

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
