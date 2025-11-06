// server/index.ts
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// raw body + urlencoded
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// API log
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let captured: any;
  const orig = res.json;
  (res as any).json = function (body: any, ...args: any[]) {
    captured = body;
    return orig.apply(res, [body, ...args]);
  };
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      let line = `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res
      .status(err?.status || err?.statusCode || 500)
      .json({ message: err?.message || "Internal Server Error" });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () =>
    log(`serving on port ${port}`),
  );
})();
