import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs"

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
const exporter = projectToken && host
  ? new OTLPLogExporter({
      url: new URL("/i/v1/logs", host).toString(),
      headers: {
        Authorization: `Bearer ${projectToken}`,
        "Content-Type": "application/json",
      },
    })
  : undefined

// This provider is intentionally private to PostHog instrumentation logs.
export const posthogLoggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ "service.name": "electronics-ecommerce-shop" }),
  processors: exporter ? [new BatchLogRecordProcessor(exporter)] : [],
})

export const posthogLogger = posthogLoggerProvider.getLogger("posthog-integration")

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  if (!projectToken && process.env.NODE_ENV !== "production") {
    throw new Error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
    )
  }

  if (!host && process.env.NODE_ENV !== "production") {
    throw new Error(
      "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured"
    )
  }
}
