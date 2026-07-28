import express from "express";
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
// At the top of server.js, with other imports
import dns from 'dns/promises';

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined,
});

const app = express();
app.set("etag", false);

const PORT         = process.env.PORT || 3000;
const OTP_API_BASE = process.env.OTP_API_BASE;
const SCANNER_BASE = process.env.SCANNER_API_BASE || "https://scan.magonai.com";
const SCAN_SERVER_HOST = "cli.niyantrisecurityai.com";
const DAST_INTERNAL_SECRET = process.env.DAST_INTERNAL_SECRET;
app.set('trust proxy', 1);

// ── FIX #4: Warn loudly at startup if CLIENT_URL is missing ──────────────────
if (!process.env.CLIENT_URL) {
  logger.warn(
    "⚠️  CLIENT_URL is not set in .env — your frontend origin will be blocked by CORS in production!"
  );
}

// Browser origins allowed to call this gateway. Only the magonai frontend runs
// in a browser — the auth, scan, CLI and DAST services are server-to-server
// callers that never send an Origin header, so they never belonged here.
//
// CLIENT_URL may hold several comma-separated origins; the check below is an
// exact includes() match, so it has to be split or it can never match.
const ALLOWED_ORIGINS = [...new Set([
  "https://magonai.com",
  "https://www.magonai.com",
  "https://scan.magonai.com",
  "https://auth.magonai.com",

  ...(process.env.CLIENT_URL || "").split(",").map(o => o.trim()),
])].filter(Boolean);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Rate Limiters ─────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  message:         { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const githubLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             30,
  message:         { error: "Too many GitHub requests, please slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const gitlabLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             30,
  message:         { error: "Too many GitLab requests, please slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const webhookLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  message:         { error: "Too many webhook requests, please slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const slackLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  message:         { error: "Too many Slack requests, please slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const dastStatusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,  // 12 req/min per user × headroom for multiple tabs
  message: { error: "Too many status requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Global Middleware ─────────────────────────────────────────────────────────

app.use(pinoHttp({ logger }));
app.use(cookieParser());

// ── Raw-body routes — must be registered BEFORE express.json() ────────────────
// GitHub push webhook — raw body required for HMAC-SHA256 signature verification
app.post(
  "/api/github/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => forwardRequest("post", "/github/webhook", req, res),
);

// GitHub push events forwarded to the scanner service
// (scanner's /webhook/github also needs raw body for its own sig verification)
app.post(
  "/api/webhook/github",
  express.raw({ type: "application/json" }),
  (req, res) => forwardToScanner("post", "/webhook/github", req, res, { rawBody: true }),
);

// Slack Events API — raw body required for signing secret verification
app.post(
  "/api/slack/events",
  express.raw({ type: "application/json" }),
  slackLimiter,
  (req, res) => forwardToScanner("post", "/slack/events", req, res, { rawBody: true }),
);

// Cashfree payment webhook
app.post(
  "/api/cashfree/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => forwardRequest("post", "/cashfree/webhook", req, res),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }));
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader  = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const cookieToken = req.cookies?.token;
  const token       = headerToken || cookieToken;
  if (!token) return res.status(401).json({ error: "Unauthorized", message: "Token missing" });
  req.userToken = token;
  next();
};

// ─── Resolve stable UUID from auth service ────────────────────────────────────

const resolveUserUuid = async (req) => {
  if (req.resolvedUuid) return req.resolvedUuid;
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const baseUrl = OTP_API_BASE.endsWith('/') ? OTP_API_BASE.slice(0, -1) : OTP_API_BASE;
const res = await axios.get(`${baseUrl}/me`, {
  headers: {
    Cookie: req.headers.cookie || '',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  withCredentials: true,
  validateStatus: () => true,
  timeout: 5000,
});
    if (res.status === 200 && res.data?.uuid) {
      req.resolvedUuid  = res.data.uuid;
      req.resolvedEmail = res.data.email || '';
      return res.data.uuid;
    }
  } catch { /* non-fatal */ }
  return null;
};

// ─── attachUser — resolves uuid + email and blocks unauthenticated requests ────
// Use on routes where the downstream service needs x-user-id / x-user-email.

const attachUser = async (req, res, next) => {
  const uuid = await resolveUserUuid(req);
  if (!uuid) return res.status(401).json({ error: "Unauthorized", message: "Could not resolve user" });
  req.resolvedUuid  = uuid;           // ← add this line
  req.resolvedEmail = req.resolvedEmail || '';
  next();
};

// ─── Auth Proxy Helper ─────────────────────────────────────────────────────────

const forwardRequest = async (method, endpoint, req, res, { passthroughRedirect = false } = {}) => {
  try {
    const baseUrl = OTP_API_BASE.endsWith('/') ? OTP_API_BASE.slice(0, -1) : OTP_API_BASE;
    const queryString = req.originalUrl.includes('?')
      ? req.originalUrl.substring(req.originalUrl.indexOf('?'))
      : '';
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}${queryString}`;

    const cashfreeHeaders = {};
    if (req.headers['x-webhook-signature']) cashfreeHeaders['x-webhook-signature'] = req.headers['x-webhook-signature'];
    if (req.headers['x-webhook-timestamp']) cashfreeHeaders['x-webhook-timestamp'] = req.headers['x-webhook-timestamp'];
    if (req.headers['x-webhook-version'])   cashfreeHeaders['x-webhook-version']   = req.headers['x-webhook-version'];
    if (req.headers['x-webhook-attempt'])   cashfreeHeaders['x-webhook-attempt']   = req.headers['x-webhook-attempt'];

    // ── FIX #3: Always forward Authorization header so the inner auth service
    //    can authenticate the request regardless of whether it reads from
    //    cookies or Bearer token. Previously this was only forwarded if present
    //    as a header, but the cookie-only path was silently dropping the token.
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    const forwardHeaders = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'X-Forwarded-For': req.ip || req.headers['x-forwarded-for'] || '',
      // Forward both the cookie AND an explicit Authorization header so the
      // downstream service can use whichever auth strategy it implements.
      Cookie: req.headers.cookie || '',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...cashfreeHeaders,
    };

    const requestBody = (() => {
      if (method === "get") return undefined;
      if (Buffer.isBuffer(req.body)) return req.body;
      return req.body;
    })();

    const response = await axios({
      method,
      url,
      data:            requestBody,
      headers:         forwardHeaders,
      withCredentials: true,
      validateStatus:  () => true,
      maxRedirects:    0,
    });

    if (response.headers["set-cookie"]) {
      let cookies = response.headers["set-cookie"];
      if (process.env.NODE_ENV !== "production") {
        cookies = cookies.map(cookie =>
          cookie
            .replace(/;\s*Domain=[^;]*/gi, '')
            .replace(/;\s*Secure/gi, '')
            .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
        );
      }
      res.setHeader("Set-Cookie", cookies);
    }

    if (passthroughRedirect && response.status >= 300 && response.status < 400 && response.headers.location) {
      return res.redirect(response.status, response.headers.location);
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Proxy Error", message: "Auth service unavailable" });
  }
};

// ─── CSRF-aware Auth Proxy Helper ─────────────────────────────────────────────

const forwardAuthRequest = async (method, endpoint, req, res) => {
  if (method === 'get') return forwardRequest(method, endpoint, req, res);

  try {
    const baseUrl = OTP_API_BASE.endsWith('/') ? OTP_API_BASE.slice(0, -1) : OTP_API_BASE;

    const csrfRes = await axios.get(`${baseUrl}/csrf-token`, {
      headers: { Cookie: req.headers.cookie || '' },
      validateStatus: () => true,
      withCredentials: true,
      timeout: 5000,
    });

    if (csrfRes.status !== 200) {
      logger.warn({ status: csrfRes.status, endpoint }, 'CSRF preflight returned non-200');
      return forwardRequest(method, endpoint, req, res);
    }

    const csrfCookies  = csrfRes.headers['set-cookie'] || [];
    const csrfToken    = csrfRes.data?.csrfToken
                      || csrfRes.data?.token
                      || csrfRes.data?.csrf
                      || '';

    const extraCookies = csrfCookies.map(c => c.split(';')[0]).join('; ');
    const mergedCookie = [req.headers.cookie, extraCookies].filter(Boolean).join('; ');

    const enrichedBody = { ...req.body, _csrf: csrfToken };

    const origCookie = req.headers.cookie;
    const origBody   = req.body;

    req.headers.cookie = mergedCookie;
    req.body           = enrichedBody;

    await forwardRequest(method, endpoint, req, res);

    req.headers.cookie = origCookie;
    req.body           = origBody;

  } catch (err) {
    logger.error({ err: err.message }, 'CSRF preflight failed');
    if (!res.headersSent) {
      res.status(502).json({ error: 'Auth service unavailable', message: err.message });
    }
  }
};


// ─── Contact Form ──────────────────────────────────────────────────────────────
app.post("/api/contact", (req, res) => forwardRequest("post", "/contact", req, res));

// ─── Auth Routes ───────────────────────────────────────────────────────────────

app.post("/api/signup",      (req, res) => forwardAuthRequest("post",   "/signup",      req, res));
app.post("/api/request-otp", (req, res) => forwardAuthRequest("post",   "/request-otp", req, res));
app.post("/api/verify-otp",  (req, res) => forwardAuthRequest("post",   "/verify-otp",  req, res));
app.post("/api/logout",      (req, res) => forwardAuthRequest("post",   "/logout",      req, res));
app.get( "/api/profile",     (req, res) => forwardRequest("get",        "/me",          req, res));
app.put( "/api/profile",     (req, res) => forwardAuthRequest("put",    "/profile",     req, res));
app.delete("/api/account",   (req, res) => forwardAuthRequest("delete", "/account",     req, res));
app.post("/api/auto-login",  (req, res) =>  forwardRequest("post", "/auto-login", req, res));

app.get("/api/csrf-token", (req, res) =>
  forwardRequest("get", "/csrf-token", req, res)
);

// ─── Wallet & Payments ─────────────────────────────────────────────────────────

app.get("/api/wallet",          authenticateToken, (req, res) => forwardRequest("get",  "/wallet",         req, res));
app.post("/api/wallet/debit",   authenticateToken, (req, res) => forwardRequest("post", "/wallet/debit",   req, res));
app.post("/api/create-order",   authenticateToken, (req, res) => forwardRequest("post", "/create-order",   req, res));
app.post("/api/verify-payment", authenticateToken, (req, res) => forwardRequest("post", "/verify-payment", req, res));
app.get("/api/pricing/me",      authenticateToken, (req, res) => forwardRequest("get",  "/pricing/me",     req, res));

// ─── Popup Routes ──────────────────────────────────────────────────────────────

app.get("/api/popups/active",       authenticateToken, (req, res) => forwardRequest("get",    "/popups/active",                     req, res));
app.get("/api/admin/popups",        authenticateToken, (req, res) => forwardRequest("get",    "/api/admin/popups",                  req, res));
app.post("/api/admin/popups",       authenticateToken, (req, res) => forwardRequest("post",   "/api/admin/popups",                  req, res));
app.put("/api/admin/popups/:id",    authenticateToken, (req, res) => forwardRequest("put",    "/api/admin/popups/" + req.params.id, req, res));
app.delete("/api/admin/popups/:id", authenticateToken, (req, res) => forwardRequest("delete", "/api/admin/popups/" + req.params.id, req, res));

// ─── GitHub Routes ─────────────────────────────────────────────────────────────

app.get("/api/auth/github/token",
  authenticateToken,
  (req, res) => forwardRequest("get", "/auth/github/token", req, res));

app.get("/api/auth/github",
  authenticateToken,
  (req, res) => forwardRequest("get", "/auth/github", req, res));

app.get("/api/auth/github/status",
  (req, res) => forwardRequest("get", "/auth/github/status", req, res));

app.get("/api/auth/github/callback",
  (req, res) => forwardRequest("get", "/auth/github/callback", req, res, { passthroughRedirect: true }));

app.get("/api/auth/github/repos",
  authenticateToken,
  githubLimiter,
  (req, res) => forwardRequest("get", "/auth/github/repos", req, res));

app.post("/api/auth/github/repos",
  authenticateToken,
  githubLimiter,
  (req, res) => forwardRequest("post", "/auth/github/repos", req, res));

app.post("/api/auth/integrations/github/save",
  authenticateToken,
  githubLimiter,
  (req, res) => forwardRequest("post", "/auth/integrations/github/save", req, res));

// ─── Webhook Config Routes — proxied to scanner service ───────────────────────

app.post("/api/webhook/config",
  authenticateToken,
  webhookLimiter,
  (req, res) => forwardToScanner("post", "/webhook/config", req, res));

app.get("/api/webhook/config/*repoUrl",
  authenticateToken,
  (req, res) => forwardToScanner("get", `/webhook/config/${encodeURIComponent(req.params.repoUrl)}`, req, res));

app.delete("/api/webhook/config/*repoUrl",
  authenticateToken,
  webhookLimiter,
  (req, res) => forwardToScanner("delete", `/webhook/config/${encodeURIComponent(req.params.repoUrl)}`, req, res));

app.get("/api/webhook/configs",
  authenticateToken,
  (req, res) => forwardToScanner("get", "/webhook/configs", req, res));

app.post("/api/webhook/test",
  authenticateToken,
  webhookLimiter,
  (req, res) => forwardToScanner("post", "/webhook/test", req, res));

// ─── Slack Auth Routes ────────────────────────────────────────────────────────

app.get("/api/auth/slack",
  (req, res) => forwardRequest("get", "/auth/slack", req, res));

app.get("/api/auth/slack/status",
  (req, res) => forwardRequest("get", "/auth/slack/status", req, res));

app.get("/api/auth/slack/callback",
  (req, res) => forwardRequest("get", "/auth/slack/callback", req, res, { passthroughRedirect: true }));

// ─── Scanner Proxy Helper ──────────────────────────────────────────────────────


const forwardToScanner = async (method, endpoint, req, res, { rawBody = false } = {}) => {
  try {
    // Forward the original query string unless the caller already built one
    // into `endpoint` itself (e.g. the workspace file route's `?path=`).
    const queryString = !endpoint.includes('?') && req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    const url = `${SCANNER_BASE}${endpoint}${queryString}`;
    const isStream =
      endpoint.includes("/stream") || endpoint === "/scan/fix/agentic";

    // Resolve authenticated UUID from auth backend
    const resolvedUserId = await resolveUserUuid(req);

    // Build headers
    const headers = rawBody
      ? {
          ...req.headers,
          host: new URL(SCANNER_BASE).host,
          "X-Forwarded-For": req.ip || req.headers["x-forwarded-for"] || "",
          ...(resolvedUserId ? { "X-User-Id": resolvedUserId } : {}),
        }
      : {
          "Content-Type": "application/json",
          "X-Forwarded-For": req.ip || req.headers["x-forwarded-for"] || "",
          ...(resolvedUserId ? { "X-User-Id": resolvedUserId } : {}),
        };

    delete headers["content-length"];

    // Prepare request body
    let body = method !== "get" ? req.body : undefined;

    // -------------------------------------------------------
    // AUTO FETCH GITHUB TOKEN FROM AUTH SERVER
    // If scan request has repo_url but no github_token
    // -------------------------------------------------------
    if (
      !rawBody &&
      method !== "get" &&
      body &&
      body.repo_url &&
      !body.github_token &&
      resolvedUserId
    ) {
      try {
        const baseUrl = OTP_API_BASE.endsWith("/")
          ? OTP_API_BASE.slice(0, -1)
          : OTP_API_BASE;

        const token = req.cookies?.token ||
          req.headers.authorization?.split(" ")[1];

        const tokenRes = await axios.get(
          `${baseUrl}/auth/github/token`,
          {
            headers: {
              Cookie: req.headers.cookie || "",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            withCredentials: true,
            validateStatus: () => true,
            timeout: 5000,
          }
        );

        if (tokenRes.status === 200 && tokenRes.data?.token) {
          body = {
            ...body,
            github_token: tokenRes.data.token,
          };

          logger.info(
            `[Gateway] Injected GitHub token for user ${resolvedUserId}`
          );
        } else {
          logger.warn(
            `[Gateway] No GitHub token found for user ${resolvedUserId}`
          );
        }
      } catch (err) {
        logger.warn(
          `[Gateway] Failed to fetch GitHub token: ${err.message}`
        );
      }
    }

    // Fail fast if auth resolution failed — don't hit the scanner unauthenticated
    if (!resolvedUserId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Session expired. Please log in again.",
      });
    }

    const axiosConfig = {
      method,
      url,
      headers,
      data: body,
      responseType: isStream ? "stream" : "json",
      validateStatus: () => true,
      timeout: isStream ? 0 : 120000,
      maxRedirects: 0,
    };

    const response = await axios(axiosConfig);

    // STREAMING RESPONSE (SSE)
    if (isStream) {
      // Don't pipe error responses as SSE — return proper JSON so the client
      // can detect and handle them (e.g. 401 session expired, 402 no credits)
      if (response.status < 200 || response.status >= 300) {
        let body = '';
        for await (const chunk of response.data) body += chunk.toString();
        try { return res.status(response.status).json(JSON.parse(body)); }
        catch { return res.status(response.status).send(body); }
      }

      res.status(response.status);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      response.data.pipe(res);
      return;
    }

    // NORMAL JSON RESPONSE
    res.status(response.status).json(response.data);

  } catch (error) {
    logger.error(error);
    res.status(500).json({
      error: "Scanner Proxy Error",
      message: "Scanner service unavailable",
    });
  }
};



// ─── Scanner Proxy Helper (multipart) ─────────────────────────────────────────

const forwardToScannerMultipart = async (method, endpoint, req, res) => {
  try {
    const url      = `${SCANNER_BASE}${endpoint}`;
    const isStream = endpoint.includes('/stream');

    const resolvedUserId = await resolveUserUuid(req);

    const headers = {
      ...req.headers,
      host:              new URL(SCANNER_BASE).host,
      'X-Forwarded-For': req.ip || req.headers['x-forwarded-for'] || '',
      ...(resolvedUserId ? { 'X-User-Id': resolvedUserId } : {}),
    };

    delete headers['content-length'];

    const axiosConfig = {
      method,
      url,
      headers,
      data:              req,
      validateStatus:    () => true,
      responseType:      isStream ? 'stream' : 'json',
      timeout:           isStream ? 0 : 60_000,
      maxBodyLength:     Infinity,
      maxContentLength:  Infinity,
    };

    const response = await axios(axiosConfig);

if (isStream) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');

  res.flushHeaders(); // 🔥 REQUIRED (fixes SSE break)

  res.status(response.status);

  response.data.pipe(res);

  response.data.on('error', () => res.end());
  req.on('close', () => response.data.destroy());
} else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    logger.error({ err: error.message }, 'Scanner multipart proxy error');
    if (!res.headersSent) {
      res.status(502).json({ error: 'Scanner service unavailable', message: error.message });
    }
  }
};


// ─── Scanner Routes ────────────────────────────────────────────────────────────

app.post('/api/scan/github',
  authenticateToken,
  githubLimiter,
  (req, res) => forwardToScanner('post', '/scan/github', req, res));

app.post('/api/scan/github/stream',
  authenticateToken,
  githubLimiter,
  (req, res) => forwardToScanner('post', '/scan/github/stream', req, res));

app.post('/api/scan/github/deep',
  authenticateToken,
  githubLimiter,
  (req, res) => forwardToScanner('post', '/scan/github/deep', req, res));

app.post('/api/scan/github/deep/stream',
  authenticateToken,
  githubLimiter,
  (req, res) => forwardToScanner('post', '/scan/github/deep/stream', req, res));

app.delete("/api/auth/github",
  authenticateToken,
  (req, res) => forwardAuthRequest("delete", "/auth/github", req, res)
);

// ─── GitLab Routes ─────────────────────────────────────────────────────────────

app.get("/api/auth/gitlab",
  authenticateToken,
  (req, res) => forwardRequest("get", "/auth/gitlab", req, res));

app.get("/api/auth/gitlab/status",
  (req, res) => forwardRequest("get", "/auth/gitlab/status", req, res));

app.get("/api/auth/gitlab/callback",
  (req, res) => forwardRequest("get", "/auth/gitlab/callback", req, res, { passthroughRedirect: true }));

app.get("/api/auth/gitlab/repos",
  authenticateToken,
  gitlabLimiter,
  (req, res) => forwardRequest("get", "/auth/gitlab/repos", req, res));

app.get("/api/auth/gitlab/token",
  authenticateToken,
  (req, res) => forwardRequest("get", "/auth/gitlab/token", req, res));

app.get("/api/auth/gitlab/selected-repos",
  authenticateToken,
  (req, res) => forwardRequest("get", "/auth/gitlab/selected-repos", req, res));

app.post("/api/auth/gitlab/select-repos",
  authenticateToken,
  gitlabLimiter,
  (req, res) => forwardRequest("post", "/auth/gitlab/select-repos", req, res));

app.delete("/api/auth/gitlab",
  authenticateToken,
  (req, res) => forwardAuthRequest("delete", "/auth/gitlab", req, res)
);


app.post('/api/scan/upload',
  authenticateToken,
  (req, res) => forwardToScannerMultipart('post', '/scan/upload', req, res));

app.post('/api/scan/upload/deep',
  authenticateToken,
  (req, res) => forwardToScannerMultipart('post', '/scan/upload/deep', req, res));

app.post('/api/scan/upload/deep/stream',
  authenticateToken,
  (req, res) => forwardToScannerMultipart('post', '/scan/upload/deep/stream', req, res));

app.post('/api/scan/fix/download',
  authenticateToken,
  (req, res) => forwardToScanner('post', '/scan/fix/download', req, res));

app.post('/api/scan/fix/agentic',
  authenticateToken,
  (req, res) => forwardToScanner('post', '/scan/fix/agentic', req, res));

app.get('/api/scan/fix/history/:scanId',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/scan/fix/history/${req.params.scanId}`, req, res));

app.post('/api/scan/fix',
  authenticateToken,
  (req, res) => forwardToScanner('post', '/scan/fix', req, res));

app.post('/api/scan/resume',
  authenticateToken,
  (req, res) => forwardToScanner('post', '/scan/resume', req, res));

app.get('/api/scan/history/me',
  authenticateToken,
  async (req, res) => {
    const uuid = await resolveUserUuid(req);
    if (!uuid) return res.status(401).json({ error: 'Could not resolve user identity' });
    forwardToScanner('get', `/scan/history/user/${uuid}`, req, res);
  });

app.get('/api/scan/history/session/:sessionId',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/scan/history/session/${req.params.sessionId}`, req, res));

app.get('/api/scan/history/:scanId/vulnerabilities',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/scan/history/${req.params.scanId}/vulnerabilities`, req, res));

app.get('/api/scan/history/:scanId',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/scan/history/${req.params.scanId}`, req, res));

app.delete('/api/scan/history/:scanId',
  authenticateToken,
  (req, res) => forwardToScanner('delete', `/scan/history/${req.params.scanId}`, req, res));

app.get('/api/scan/report/:scanId',
  authenticateToken,
  async (req, res) => {
    // The Python backend returns a binary PDF (application/pdf).
    // forwardToScanner uses responseType:'json' for non-stream routes which
    // corrupts binary data.  This handler uses responseType:'stream' so the
    // raw bytes are piped through untouched.
    try {
      const resolvedUserId = await resolveUserUuid(req);
      const url = `${SCANNER_BASE}/scan/report/${req.params.scanId}`;

      const response = await axios({
        method: 'get',
        url,
        headers: {
          'X-Forwarded-For': req.ip || req.headers['x-forwarded-for'] || '',
          ...(resolvedUserId ? { 'X-User-Id': resolvedUserId } : {}),
        },
        responseType: 'stream',   // ← keep bytes intact
        validateStatus: () => true,
        timeout: 60000,
      });

      // Forward non-2xx errors as JSON so the client gets a readable message
      if (response.status !== 200) {
        let body = '';
        for await (const chunk of response.data) body += chunk;
        try { return res.status(response.status).json(JSON.parse(body)); }
        catch { return res.status(response.status).send(body); }
      }

      res.status(200);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        response.headers['content-disposition'] ||
          `attachment; filename=report_${req.params.scanId}.pdf`,
      );
      response.data.pipe(res);
    } catch (err) {
      logger.error({ err: err.message }, 'PDF report proxy error');
      if (!res.headersSent) {
        res.status(502).json({ error: 'Report unavailable', message: err.message });
      }
    }
  });

// ─── Chat Routes ───────────────────────────────────────────────────────────────

app.post('/api/chat/stream',
  authenticateToken,
  (req, res) => forwardToScanner('post', '/chat/stream', req, res));

app.get('/api/chat/history/:scanId',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/chat/history/${req.params.scanId}`, req, res));

// ─── Teams Routes ─────────────────────────────────────────────────────────────

app.get("/api/auth/teams",
  authenticateToken,
  (req, res) => forwardRequest("get", "/auth/teams", req, res));

app.get("/api/auth/teams/status",
  (req, res) => forwardRequest("get", "/auth/teams/status", req, res));

app.get("/api/auth/teams/callback",
  (req, res) => forwardRequest("get", "/auth/teams/callback", req, res, { passthroughRedirect: true }));

// ─── Slack Bot Routes ─────────────────────────────────────────────────────────
// /api/slack/events (raw body) is registered above before express.json().

/**
 * POST /api/slack/bind
 *
 * Orchestrates the two-step bind:
 *   1. Auth server  — saves {channel, scan_id, branch} to SlackCredential.bindings
 *                     and returns the xoxb- slack_token + github_token for this user
 *   2. Python scanner — saves the full binding so the bot can post messages and push fixes
 *
 * FIX: If auth server does not return github_token (because it doesn't select the
 * field or doesn't include it in its response body), the gateway fetches it directly
 * from /auth/github/token as a fallback before forwarding to the scanner.
 */
app.post("/api/slack/bind",
  authenticateToken,
  slackLimiter,
  async (req, res) => {
    try {
      // ── Mandatory field validation ─────────────────────────────────────────
      const { scan_id, channel } = req.body;

      if (!scan_id) {
        return res.status(400).json({ error: "Bad Request", message: "scan_id is required" });
      }
      if (!channel) {
        return res.status(400).json({ error: "Bad Request", message: "channel is required" });
      }

      const baseUrl = OTP_API_BASE.endsWith('/')
        ? OTP_API_BASE.slice(0, -1)
        : OTP_API_BASE;

      // ── STEP 1: Get CSRF token ─────────────────────────────────────────────
      const csrfRes = await axios.get(`${baseUrl}/csrf-token`, {
        headers: { Cookie: req.headers.cookie || "" },
        withCredentials: true,
        validateStatus: () => true,
      });

      const csrfToken   = csrfRes.data?.csrfToken || csrfRes.data?.token || csrfRes.data?.csrf || "";
      const csrfCookies = csrfRes.headers["set-cookie"] || [];

      const cookieHeader = [
        req.headers.cookie,
        ...csrfCookies.map(c => c.split(";")[0])
      ].filter(Boolean).join("; ");

      // ── STEP 2: Call auth server to save binding + get tokens ─────────────
      const authRes = await axios.post(
        `${baseUrl}/auth/slack/bind`,
        { ...req.body, _csrf: csrfToken },
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          withCredentials: true,
          validateStatus: () => true,
          timeout: 10000,
        }
      );

      logger.info({ status: authRes.status, body: authRes.data }, "AUTH /auth/slack/bind response");

      if (authRes.status !== 200) {
        return res.status(authRes.status).json(authRes.data);
      }

      const {
        slack_token,
        github_token:  github_token_from_auth,
        channel:       authChannel,
        scan_id:       authScanId,
        branch,
        user_id,
      } = authRes.data;
         
      if (!authChannel || authChannel === "DM") {
        return res.status(500).json({
          error: "Auth server did not return DM channel (DXXXX)"
        });
      }

      // ── STEP 2.5: GitHub token fallback ───────────────────────────────────
      let github_token = github_token_from_auth || "";

      if (!github_token) {
        logger.warn("github_token missing from auth response — fetching from /auth/github/token");
        try {
          const ghRes = await axios.get(`${baseUrl}/auth/github/token`, {
            headers: { Cookie: req.headers.cookie || "" },
            withCredentials: true,
            validateStatus: () => true,
            timeout: 5000,
          });

          if (ghRes.status === 200) {
            github_token =
              ghRes.data?.token          ||
              ghRes.data?.access_token   ||
              ghRes.data?.github_token   ||
              ghRes.data?.accessToken    ||
              "";

            if (github_token) {
              logger.info({ prefix: github_token.slice(0, 10) + "…" }, "GitHub token fetched via fallback");
            } else {
              logger.warn({ body: ghRes.data }, "GitHub token fallback: unexpected response shape");
            }
          } else {
            logger.warn({ status: ghRes.status }, "GitHub token fallback: non-200 from /auth/github/token");
          }
        } catch (ghErr) {
          logger.warn({ err: ghErr.message }, "GitHub token fallback fetch failed (non-fatal)");
        }
      }

      logger.info({
        step:                "slack_bind_gateway",
        has_slack_token:     !!slack_token,
        slack_token_prefix:  slack_token  ? slack_token.slice(0, 10)  + "…" : "MISSING",
        has_github_token:    !!github_token,
        github_token_prefix: github_token ? github_token.slice(0, 10) + "…" : "MISSING",
      }, "Slack bind: tokens ready for scanner");

      // ── STEP 3: Forward full binding to Python scanner ────────────────────
      const resolvedUserId = await resolveUserUuid(req);

      const scannerRes = await axios.post(
        `${SCANNER_BASE}/slack/bind`,
        {
          channel: authChannel,
          scan_id:      authScanId  || scan_id,
          branch:       branch      || req.body.branch || "main",
          slack_token:  slack_token  || "",
          github_token: github_token || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id":    resolvedUserId || user_id || "",
          },
          validateStatus: () => true,
          timeout: 10000,
        }
      );

      if (scannerRes.status !== 200) {
        return res.status(scannerRes.status).json(scannerRes.data);
      }

      // ── STEP 4: Patch repo_url back to auth DB ────────────────────────────
      const repo_url = scannerRes.data?.repo_url || "";

      if (repo_url) {
        try {
          await axios.patch(
            `${baseUrl}/auth/slack/bind`,
            { channel, repo_url },
            {
              headers: {
                "Content-Type": "application/json",
                Cookie: req.headers.cookie || "",
              },
              validateStatus: () => true,
              timeout: 5000,
            }
          );
        } catch (patchErr) {
          logger.warn({ err: patchErr.message }, "Could not patch repo_url back to auth DB (non-fatal)");
        }
      }

      return res.json(scannerRes.data);

    } catch (err) {
      logger.error({ err: err.message }, "Slack bind orchestration error");
      return res.status(502).json({ error: "Slack bind failed", message: err.message });
    }
  }
);

/**
 * DELETE /api/slack/bind
 * Removes binding from both auth DB and Python scanner.
 */
app.delete("/api/slack/bind",
  authenticateToken,
  slackLimiter,
  async (req, res) => {
    try {
      const baseUrl = OTP_API_BASE.endsWith('/') ? OTP_API_BASE.slice(0, -1) : OTP_API_BASE;

      // Remove from auth DB
      await axios.delete(
        `${baseUrl}/auth/slack/bind`,
        {
          data: req.body,
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.cookie || "",
          },
          validateStatus: () => true,
          timeout: 10000,
        }
      );

      // Remove from Python scanner
      const resolvedUserId = await resolveUserUuid(req);
      const scannerRes = await axios.delete(
        `${SCANNER_BASE}/slack/bind`,
        {
          data: req.body,
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": resolvedUserId || "",
          },
          validateStatus: () => true,
          timeout: 10000,
        }
      );

      return res.status(scannerRes.status).json(scannerRes.data);
    } catch (err) {
      logger.error({ err: err.message }, "Slack unbind error");
      return res.status(502).json({ error: "Slack unbind failed", message: err.message });
    }
  }
);

/**
 * GET /api/slack/bindings
 * Fetches bindings from scanner DB.
 */
app.get("/api/slack/bindings",
  authenticateToken,
  (req, res) => forwardToScanner("get", "/slack/bindings", req, res)
);

//cliroutes

async function proxyScanServer({ path, method, headers }, res, logger) {
  try {
    const url = `https://${SCAN_SERVER_HOST}${path}`;

    const response = await axios({
      method,
      url,
      headers,
      timeout: 10000,
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);

  } catch (err) {
    logger.error("Proxy error:", err.message);
    res.status(502).json({ error: "CLI server unreachable" });
  }
}
app.post("/api/cli/auth/confirm", (req, res) =>
  forwardAuthRequest("post", "/cli/auth/confirm", req, res)
);

// Proxy to auth service — session cookie forwarded for authentication
app.get("/api/cli/keys",          (req, res) => forwardRequest("get",  "/cli/keys",        req, res));
app.post("/api/cli/keys/revoke",  (req, res) => forwardAuthRequest("post", "/cli/keys/revoke", req, res));

export function registerCliScanRoutes(app, { authenticateJWT, logger, resolveUserUuid }) { 
  // ── GET /api/cli/scans?page=N&limit=N ─────────────────────
  // Returns paginated scan history for the logged-in user.
  // Forwards to GET https://cli.niyantrisecurityai.com/scan/history
  app.get("/api/cli/scans", authenticateJWT, async (req, res) => {
    try {
      const { page = "1", limit = "20" } = req.query;
      const userId = await resolveUserUuid(req);  // populated by authenticateJWT
 
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }
 
      const upstreamPath = `/scan/history?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
 
   await proxyScanServer(
  {
    path: upstreamPath,
    method: "GET",
headers: {
  "x-user-id": userId,
  "Content-Type": "application/json",
  "Authorization": req.headers.authorization || "",
  "Cookie": req.headers.cookie || "",
},
  },
  res,
  logger
);
    } catch (err) {
      logger.error("Proxy /api/cli/scans failed:", err.message);
      // Avoid double-sending if headers were already flushed
      if (!res.headersSent) {
        return res.status(500).json({ error: "Could not fetch scan history" });
      }
    }
  });
 
  // ── GET /api/cli/scans/:scanId ─────────────────────────────
  // Returns the full scan detail (including vulnerability list).
  // Forwards to GET https://cli.niyantrisecurityai.com/scan/:scanId
app.get("/api/cli/scans/:scanId", authenticateJWT, async (req, res) => {
  try {
    const { scanId } = req.params;

    const userId = await resolveUserUuid(req);

    if (!userId) {
      return res.status(401).json({ error: "User ID not found in session" });
    }

    if (!/^[a-f0-9]{24}$/i.test(scanId)) {
      return res.status(400).json({ error: "Invalid scan ID" });
    }

    await proxyScanServer(
      {
        path: `/scan/${scanId}`,
        method: "GET",
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
          "x-api-key": req.headers["x-api-key"] 
            || req.cookies?.apiKey 
            || process.env.CLI_API_KEY || "",
          "Authorization": req.headers.authorization || "",
          "Cookie": req.headers.cookie || "",
        },
      },
      res,
      logger
    );

  } catch (err) {
    logger.error("Proxy /api/cli/scans/:scanId failed:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Could not fetch scan detail" });
    }
  }
});
 
  logger.info("CLI scan proxy routes registered: GET /api/cli/scans  GET /api/cli/scans/:scanId");
};


//_______google auth____________________________________________

// Google OAuth
app.get("/api/auth/google",
  (req, res) => forwardRequest("get", "/auth/google", req, res, { passthroughRedirect: true })
);

app.get("/api/auth/google/callback",
  (req, res) => forwardRequest("get", "/auth/google/callback", req, res, { passthroughRedirect: true })
);

app.post("/api/signup/google",
  (req, res) => forwardAuthRequest("post", "/api/signup/google", req, res)
);


// ── Fix workspace (patch verification panel) ──────────────────────────────────
app.get('/api/scan/fix/workspace/:scanId/tree',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/scan/fix/workspace/${req.params.scanId}/tree`, req, res));

app.get('/api/scan/fix/workspace/:scanId/file',
  authenticateToken,
  (req, res) => {
    const qs = req.query.path ? `?path=${encodeURIComponent(req.query.path)}` : '';
    forwardToScanner('get', `/scan/fix/workspace/${req.params.scanId}/file${qs}`, req, res);
  });

// ── Dependency scan stream ────────────────────────────────────────────────────
app.post('/api/scan/github/deep/stream/dependencies',
  authenticateToken,
  (req, res) => forwardToScannerStream('post', '/scan/github/deep/stream/dependencies', req, res));

// ── Fix verification stream ───────────────────────────────────────────────────
app.post('/api/scan/fix/verify/stream',
  authenticateToken,
  (req, res) => forwardToScanner('post', '/scan/fix/verify/stream', req, res));

// ── Credits history ───────────────────────────────────────────────────────────
app.get('/api/scan/credits/history/:userId',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/scan/credits/history/${req.params.userId}`, req, res));

// ── Knowledge graph ───────────────────────────────────────────────────────────
// Returns the Cytoscape-ready { nodes, edges } graph for a whole scan group
// (File / Function / Infrastructure / ExternalEndpoint nodes and the
// IMPORTS / CONTAINS / CALLS / EXTERNAL_CALL / CROSS_REPO_CALLS / USES edges).
app.get('/api/scan/graph/:groupScanId',
  authenticateToken,
  (req, res) => forwardToScanner('get', `/scan/graph/${req.params.groupScanId}`, req, res));

// ── Group deletion ────────────────────────────────────────────────────────────
// Wipes every repo in a scan group: Mongo docs, disk files, phase storage,
// fix workspaces and the Neo4j graph for that workspace.
app.delete('/api/scan/history/group/:groupScanId',
  authenticateToken,
  (req, res) => forwardToScanner('delete', `/scan/history/group/${req.params.groupScanId}`, req, res));
// ─── DAST (ZAP) Routes ────────────────────────────────────────────────────────
//
// All /api/dast/* requests are forwarded to the local ZAP Flask bridge
// (app.py running on 127.0.0.1:5000).  The bridge owns ZAP and manages
// report files; the gateway just proxies + adds auth.
//
const DAST_BASE = process.env.DAST_API_BASE || "http://127.0.0.1:5000";

const dastLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             20,
  message:         { error: "Too many DAST requests, please slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Extra-tight limiter for scan start only (scans are expensive)
const dastScanLimiter = rateLimit({
  windowMs:        5 * 60 * 1000,
  max:             3,
  message:         { error: "Too many scan requests. Please wait before starting another scan." },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ─── URL Validation Helper ─────────────────────────────────────────────────────
 
async function validateTargetUrl(url) {
  if (!url || typeof url !== 'string') return "Target URL is required";
  let parsed;
  try { parsed = new URL(url); } catch { return "Invalid URL format"; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return "Only HTTP/HTTPS URLs are allowed";
  let resolvedIp;
  try { resolvedIp = (await dns.lookup(parsed.hostname)).address; } catch { return "Could not resolve hostname"; }
  const privateRanges = [/^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^169\.254\./, /^0\.0\.0\.0/, /^::1$/];
  if (privateRanges.some(r => r.test(resolvedIp))) return "Internal/private IP targets are not allowed";
  return null;
}
 
// ─── Scan body validation helper ──────────────────────────────────────────────
// [NEW] Validates and whitelists all known POST /api/scan body fields.
// Unknown keys are stripped; known keys are type-coerced with safe defaults.
// This prevents injection of unexpected fields into the downstream Flask API.
 
function sanitizeScanBody(raw = {}) {
  const body = {};
 
  // Required
  body.target = typeof raw.target === 'string' ? raw.target.trim() : '';
 
  // Auth block — pass through as-is (app.py validates its own auth sub-fields)
  if (raw.auth && typeof raw.auth === 'object' && !Array.isArray(raw.auth)) {
    // Strip any credential keys we don't want logged in our gateway
    const { password, totpSecret, sideFileB64, bearerToken, sessionCookie, ...meta } = raw.auth;
    body.auth = raw.auth; // full block still forwarded — app.py needs creds
  }
 
  // Arrays — coerce to string arrays, cap at 50 items
  if (Array.isArray(raw.seedUrls)) {
    body.seedUrls = raw.seedUrls.slice(0, 50).map(u => String(u).trim()).filter(Boolean);
  }
  if (Array.isArray(raw.logoutUrls)) {
    body.logoutUrls = raw.logoutUrls.slice(0, 50).map(u => String(u).trim()).filter(Boolean);
  }
 
  // [U1] OpenAPI
  if (typeof raw.openApiUrl === 'string') body.openApiUrl = raw.openApiUrl.trim().slice(0, 2000);
  if (typeof raw.openApiSpec === 'string') body.openApiSpec = raw.openApiSpec.slice(0, 500_000); // base64 YAML
 
  // [U2] Parallel scan
  if (typeof raw.parallelScan === 'boolean') body.parallelScan = raw.parallelScan;
 
  // [U4] Token TTL
  if (typeof raw.tokenTtlSec === 'number') {
    body.tokenTtlSec = Math.max(60, Math.min(3600, Math.round(raw.tokenTtlSec)));
  }
 
  // [U6] Browser spider
  if (typeof raw.useBrowser === 'boolean') body.useBrowser = raw.useBrowser;
 
  // [NEW] GraphQL scanning flag
  if (typeof raw.scanGraphQL === 'boolean') body.scanGraphQL = raw.scanGraphQL;
 
  // [NEW] JSON fuzzing flag
  if (typeof raw.jsonFuzz === 'boolean') body.jsonFuzz = raw.jsonFuzz;
 
  return body;
}
 
// ─── DAST Proxy Helper ─────────────────────────────────────────────────────────
 
const forwardToDast = async (method, endpoint, req, res) => {
  try {
    const queryString = req.originalUrl.includes('?')
      ? req.originalUrl.substring(req.originalUrl.indexOf('?'))
      : '';
    const url = `${DAST_BASE}${endpoint}${queryString}`;
 
    const response = await axios({
      method,
      url,
      data: method !== 'get' ? req.body : undefined,
      headers: {
        "Content-Type":      "application/json",
        "X-Forwarded-For":   req.ip || '',
        "x-user-id":         req.resolvedUuid  || '',
        "x-user-email":      req.resolvedEmail || '',
        "X-Internal-Secret": DAST_INTERNAL_SECRET || '',
      },
      validateStatus: () => true,
      timeout: 150000,
    });
 
    res.status(response.status).json(response.data);
  } catch (err) {
    logger.error("DAST proxy error:", err.message);
    res.status(502).json({ error: "DAST service unavailable" });
  }
};
 
// ─── DAST Routes ──────────────────────────────────────────────────────────────
 
// POST /api/dast/scan
// Accepts all scan options and forwards to Flask app.py.
// Body is sanitised via sanitizeScanBody() before forwarding.
app.post('/api/dast/scan',
  authenticateToken,
  attachUser,
  dastScanLimiter,
  dastLimiter,
  async (req, res) => {
    const body     = sanitizeScanBody(req.body);
    const urlError = await validateTargetUrl(body.target);
    if (urlError) return res.status(400).json({ error: urlError });
 
    // Replace req.body with the sanitised version for forwardToDast
    req.body = body;
    forwardToDast('post', '/api/scan', req, res);
  }
);
 
// GET /api/dast/scan/status?scanId=<id>
// [NEW] Also checks Redis progress cache via app.py, which returns it in the
// standard status response if the scan was started via the queue.
app.get('/api/dast/scan/status',
  authenticateToken,
  attachUser,
  dastStatusLimiter,
  (req, res) => forwardToDast('get', '/api/scan/status', req, res)
);
 
// POST /api/dast/scan/:scanId/cancel
app.post('/api/dast/scan/:scanId/cancel',
  authenticateToken,
  attachUser,
  dastLimiter,
  (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.scanId)) {
      return res.status(400).json({ error: "Invalid scan ID" });
    }
    forwardToDast('post', `/api/scan/${req.params.scanId}/cancel`, req, res);
  }
);
 
// GET /api/dast/reports?page=&limit=
app.get('/api/dast/reports',
  authenticateToken,
  attachUser,
  dastLimiter,
  (req, res) => forwardToDast('get', '/api/reports', req, res)
);
 
// GET /api/dast/report/:scanId
app.get('/api/dast/report/:scanId',
  authenticateToken,
  attachUser,
  dastLimiter,
  (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.scanId)) {
      return res.status(400).json({ error: "Invalid scan ID" });
    }
    forwardToDast('get', `/api/report/${req.params.scanId}`, req, res);
  }
);
 
// [NEW] GET /api/dast/health
// Exposes Flask + ZAP + Redis/queue health to the frontend without
// requiring the frontend to talk to the Flask port directly.
app.get('/api/dast/health',
  authenticateToken,
  dastLimiter,
  (req, res) => forwardToDast('get', '/api/health', req, res)
);
 
 
// ─── Workspace Routes ─────────────────────────────────────────────────────────
// All forwarded to spirit_code (SCANNER_BASE) with X-User-Id injected.

// Membership
app.get('/api/workspace/me',
  authenticateToken,
  (req, res) => forwardToScanner('get', '/workspace/me', req, res));

// Members list + management
app.get('/api/workspace/members',
  authenticateToken,
  (req, res) => forwardToScanner('get', '/workspace/members', req, res));

app.delete('/api/workspace/members/:memberId',
  authenticateToken,
  (req, res) => forwardToScanner('delete', `/workspace/members/${req.params.memberId}`, req, res));

app.patch('/api/workspace/members/:memberId/permissions',
  authenticateToken,
  (req, res) => forwardToScanner('patch', `/workspace/members/${req.params.memberId}/permissions`, req, res));

app.patch('/api/workspace/members/:memberId/suspend',
  authenticateToken,
  (req, res) => forwardToScanner('patch', `/workspace/members/${req.params.memberId}/suspend`, req, res));

app.patch('/api/workspace/members/:memberId/activate',
  authenticateToken,
  (req, res) => forwardToScanner('patch', `/workspace/members/${req.params.memberId}/activate`, req, res));

// Invitations — list + send
app.get('/api/workspace/invitations',
  authenticateToken,
  (req, res) => forwardToScanner('get', '/workspace/invitations', req, res));

app.post('/api/workspace/invite',
  authenticateToken,
  (req, res) => forwardToScanner('post', '/workspace/invite', req, res));

// Invitations — pending check (used on Dashboard)
app.get('/api/workspace/invitations/pending',
  authenticateToken,
  (req, res) => forwardToScanner('get', '/workspace/invitations/pending', req, res));

// Invitations — public token lookup (no auth required — invitee may not be logged in yet)
app.get('/api/workspace/invitations/:token',
  (req, res) => forwardToScanner('get', `/workspace/invitations/${req.params.token}`, req, res));

// Invitations — accept / decline / revoke
app.post('/api/workspace/invitations/:token/accept',
  authenticateToken,
  (req, res) => forwardToScanner('post', `/workspace/invitations/${req.params.token}/accept`, req, res));

app.post('/api/workspace/invitations/:token/decline',
  authenticateToken,
  (req, res) => forwardToScanner('post', `/workspace/invitations/${req.params.token}/decline`, req, res));

app.delete('/api/workspace/invitations/:invitationId/revoke',
  authenticateToken,
  (req, res) => forwardToScanner('delete', `/workspace/invitations/${req.params.invitationId}/revoke`, req, res));

// Credits
app.get('/api/workspace/credits',
  authenticateToken,
  (req, res) => forwardToScanner('get', '/workspace/credits', req, res));

app.put('/api/workspace/credits',
  authenticateToken,
  (req, res) => forwardToScanner('put', '/workspace/credits', req, res));

// Audit logs
app.get('/api/workspace/audit-logs',
  authenticateToken,
  (req, res) => forwardToScanner('get', '/workspace/audit-logs', req, res));

// ─── Group scan notification ───────────────────────────────────────────────────

app.post('/api/scan/group/:groupScanId/notify',
  authenticateToken,
  (req, res) => forwardToScanner('post', `/scan/group/${req.params.groupScanId}/notify`, req, res));

// ─── Health ────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.redirect('/api/health'));
 
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", server: "Gateway", port: PORT }));


// ─── SPA Fallback ──────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

registerCliScanRoutes(app, {
  authenticateJWT: authenticateToken,
  logger,
  resolveUserUuid,
});

app.listen(PORT, () => logger.info(`🚀 Gateway running on http://localhost:${PORT}`));