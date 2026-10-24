# Security boundary

API previews bind to loopback and reject foreign Host/Origin headers. Public hosting requires authentication and authorization, spending limits, and HTTPS. Do not bypass this guard by rewriting untrusted requests to a localhost Host. WebSocket previews require a matching Origin too. This guard is not public-service user authentication.
