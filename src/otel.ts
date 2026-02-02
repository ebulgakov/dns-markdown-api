import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { env } from "@src/env.ts";

// Read env vars directly to avoid circular dependency with env.ts
const OTEL_ENDPOINT = env.OTEL_EXPORTER_OTLP_ENDPOINT;
const OTEL_HEADERS = env.OTEL_EXPORTER_OTLP_HEADERS;
const NODE_ENV = env.NODE_ENV;

// Only initialize OpenTelemetry in production with proper credentials
const isOtelEnabled = OTEL_ENDPOINT && OTEL_HEADERS && NODE_ENV === "production";

console.log(isOtelEnabled, OTEL_ENDPOINT, OTEL_HEADERS, NODE_ENV);

if (isOtelEnabled || true) {
  const headers = parseOtelHeaders(OTEL_HEADERS);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "dns-markdown-api",
    [ATTR_SERVICE_VERSION]: "1.0.0",
    environment: NODE_ENV
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${OTEL_ENDPOINT}/v1/traces`,
    headers
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${OTEL_ENDPOINT}/v1/metrics`,
    headers
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000 // Export metrics every 60 seconds
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to reduce noise
        "@opentelemetry/instrumentation-fs": { enabled: false }
      })
    ]
  });

  sdk.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("OpenTelemetry SDK shut down successfully"))
      .catch(error => console.error("Error shutting down OpenTelemetry SDK", error))
      .finally(() => process.exit(0));
  });

  console.log("OpenTelemetry initialized with Grafana Cloud");
}

/**
 * Parse OTEL headers from URL-encoded format
 * Example: "Authorization=Basic%20abc123" -> { Authorization: "Basic abc123" }
 */
function parseOtelHeaders(headersString: string): Record<string, string> {
  const headers: Record<string, string> = {};

  headersString.split(",").forEach(pair => {
    const [key, ...valueParts] = pair.split("=");
    if (key && valueParts.length > 0) {
      headers[key.trim()] = decodeURIComponent(valueParts.join("="));
    }
  });

  return headers;
}
