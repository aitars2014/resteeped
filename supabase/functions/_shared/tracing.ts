/**
 * OpenTelemetry tracing for Supabase Edge Functions → Honeycomb
 *
 * Lightweight OTLP exporter for Deno runtime.
 * Supabase Edge Functions don't support the full OTel SDK, so we
 * manually construct spans and export via OTLP/HTTP JSON.
 */

const HONEYCOMB_ENDPOINT = 'https://api-dogfood.honeycomb.io/v1/traces'
const SERVICE_NAME = 'resteeped-edge-functions'

interface SpanContext {
  traceId: string
  spanId: string
  parentSpanId?: string
}

interface SpanEvent {
  name: string
  timeUnixNano: string
  attributes?: OtelAttribute[]
}

interface OtelAttribute {
  key: string
  value: { stringValue?: string; intValue?: string; doubleValue?: string; boolValue?: boolean }
}

interface SpanData {
  name: string
  context: SpanContext
  startTimeUnixNano: string
  endTimeUnixNano?: string
  attributes: Record<string, string | number | boolean>
  events: SpanEvent[]
  status?: { code: number; message?: string }
}

function generateId(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

function nowNano(): string {
  return (BigInt(Date.now()) * 1_000_000n).toString()
}

function toOtelAttribute(key: string, value: string | number | boolean): OtelAttribute {
  if (typeof value === 'string') return { key, value: { stringValue: value } }
  if (typeof value === 'boolean') return { key, value: { boolValue: value } }
  if (Number.isInteger(value)) return { key, value: { intValue: String(value) } }
  return { key, value: { doubleValue: String(value) } }
}

export class Span {
  private data: SpanData

  constructor(name: string, parentContext?: SpanContext) {
    this.data = {
      name,
      context: {
        traceId: parentContext?.traceId || generateId(16),
        spanId: generateId(8),
        parentSpanId: parentContext?.spanId,
      },
      startTimeUnixNano: nowNano(),
      attributes: {
        'service.name': SERVICE_NAME,
      },
      events: [],
    }
  }

  setAttribute(key: string, value: string | number | boolean): this {
    this.data.attributes[key] = value
    return this
  }

  setAttributes(attrs: Record<string, string | number | boolean>): this {
    Object.assign(this.data.attributes, attrs)
    return this
  }

  addEvent(name: string, attrs?: Record<string, string | number | boolean>): this {
    const event: SpanEvent = { name, timeUnixNano: nowNano() }
    if (attrs) {
      event.attributes = Object.entries(attrs).map(([k, v]) => toOtelAttribute(k, v))
    }
    this.data.events.push(event)
    return this
  }

  setError(error: Error | string): this {
    const message = error instanceof Error ? error.message : error
    this.data.status = { code: 2, message }
    this.data.attributes['error'] = true
    this.data.attributes['exception.message'] = message
    if (error instanceof Error && error.stack) {
      this.data.attributes['exception.stacktrace'] = error.stack
    }
    return this
  }

  setOk(): this {
    this.data.status = { code: 1 }
    return this
  }

  get context(): SpanContext {
    return { ...this.data.context }
  }

  end(): SpanData {
    this.data.endTimeUnixNano = nowNano()
    return this.data
  }

  toOtlp(): object {
    return {
      traceId: this.data.context.traceId,
      spanId: this.data.context.spanId,
      parentSpanId: this.data.context.parentSpanId || '',
      name: this.data.name,
      kind: 2, // SPAN_KIND_SERVER
      startTimeUnixNano: this.data.startTimeUnixNano,
      endTimeUnixNano: this.data.endTimeUnixNano || nowNano(),
      attributes: Object.entries(this.data.attributes).map(([k, v]) => toOtelAttribute(k, v)),
      events: this.data.events,
      status: this.data.status || { code: 0 },
    }
  }
}

export class Tracer {
  private spans: Span[] = []
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('HONEYCOMB_API_KEY') || ''
  }

  startSpan(name: string, parentContext?: SpanContext): Span {
    const span = new Span(name, parentContext)
    this.spans.push(span)
    return span
  }

  /** Time an async operation as a child span */
  async trace<T>(
    name: string,
    parentContext: SpanContext,
    attrs: Record<string, string | number | boolean>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const span = this.startSpan(name, parentContext)
    span.setAttributes(attrs)
    try {
      const result = await fn()
      span.setOk()
      return result
    } catch (err) {
      span.setError(err instanceof Error ? err : new Error(String(err)))
      throw err
    } finally {
      span.end()
    }
  }

  /** Flush all collected spans to Honeycomb. Fire-and-forget (won't block response). */
  async flush(): Promise<void> {
    if (!this.apiKey || this.spans.length === 0) return

    const body = {
      resourceSpans: [
        {
          resource: {
            attributes: [
              toOtelAttribute('service.name', SERVICE_NAME),
              toOtelAttribute('deployment.environment', 'production'),
            ],
          },
          scopeSpans: [
            {
              scope: { name: 'resteeped-edge-functions', version: '1.0.0' },
              spans: this.spans.map((s) => {
                s.end() // ensure ended
                return s.toOtlp()
              }),
            },
          ],
        },
      ],
    }

    try {
      await fetch(HONEYCOMB_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-honeycomb-team': this.apiKey,
        },
        body: JSON.stringify(body),
      })
    } catch (_) {
      // Don't let tracing failures break the application
    }

    this.spans = []
  }
}

/**
 * Wrap a Supabase Edge Function handler with automatic tracing.
 * Creates a root span for the request and flushes traces on completion.
 */
export function withTracing(
  functionName: string,
  handler: (req: Request, tracer: Tracer, rootSpan: Span) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const apiKey = Deno.env.get('HONEYCOMB_API_KEY')
    if (!apiKey) {
      // No API key — run without tracing
      const dummyTracer = new Tracer('')
      const dummySpan = new Span(functionName)
      return handler(req, dummyTracer, dummySpan)
    }

    const tracer = new Tracer(apiKey)
    const rootSpan = tracer.startSpan(functionName)

    rootSpan.setAttributes({
      'http.method': req.method,
      'http.url': req.url,
      'function.name': functionName,
    })

    // Extract trace context from incoming headers (W3C traceparent)
    const traceparent = req.headers.get('traceparent')
    if (traceparent) {
      rootSpan.setAttribute('traceparent', traceparent)
    }

    let response: Response
    try {
      response = await handler(req, tracer, rootSpan)
      rootSpan.setAttribute('http.status_code', response.status)
      if (response.status >= 400) {
        rootSpan.setAttribute('error', true)
      } else {
        rootSpan.setOk()
      }
    } catch (err) {
      rootSpan.setError(err instanceof Error ? err : new Error(String(err)))
      rootSpan.setAttribute('http.status_code', 500)
      response = new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    } finally {
      rootSpan.end()
      // Flush in background — don't delay the response
      tracer.flush().catch(() => {})
    }

    return response
  }
}
