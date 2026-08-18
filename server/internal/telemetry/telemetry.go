// Package telemetry 按标准 OpenTelemetry 环境变量装配 trace/metric。
// 未设置 OTEL_EXPORTER_OTLP_ENDPOINT（或 OTEL_SDK_DISABLED=true）时返回
// no-op，全局 provider 保持默认的空实现，热路径零额外开销。
// 本地/e2e 调试可把 OTEL_EXPORTER_OTLP_ENDPOINT 设为 "stdout"，直接打印 span。
package telemetry

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/exporters/stdout/stdoutmetric"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

// Shutdown 冲刷并停止 provider；进程退出前必须调用，否则尾部 span 会丢。
type Shutdown func(context.Context) error

// Setup 初始化全局 TracerProvider/MeterProvider。serviceVersion 用 Git commit，
// deploymentID 用 Railway deployment id，便于把遥测锚定到具体发布。
func Setup(ctx context.Context, serviceVersion, deploymentID string) (Shutdown, error) {
	noop := Shutdown(func(context.Context) error { return nil })
	if strings.EqualFold(os.Getenv("OTEL_SDK_DISABLED"), "true") {
		return noop, nil
	}
	endpoint := strings.TrimSpace(os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"))
	if endpoint == "" {
		return noop, nil
	}

	serviceName := strings.TrimSpace(os.Getenv("OTEL_SERVICE_NAME"))
	if serviceName == "" {
		serviceName = "dshfind-api"
	}
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.ServiceVersion(serviceVersion),
			// semconv v1.26 尚无 DeploymentID 常量；deployment.id 是稳定约定名。
			attribute.String("deployment.id", deploymentID),
		),
	)
	if err != nil {
		return noop, fmt.Errorf("otel resource: %w", err)
	}

	var (
		traceExporter  sdktrace.SpanExporter
		metricExporter sdkmetric.Exporter
	)
	if strings.EqualFold(endpoint, "stdout") {
		// 本地与 compose e2e 的调试验证路径：无 collector，直接打印。
		traceExporter, err = stdouttrace.New()
		if err != nil {
			return noop, fmt.Errorf("otel stdout trace exporter: %w", err)
		}
		metricExporter, err = stdoutmetric.New()
		if err != nil {
			return noop, fmt.Errorf("otel stdout metric exporter: %w", err)
		}
	} else {
		// 生产路径：otlp*http exporter 自身读取 OTEL_EXPORTER_OTLP_* 标准变量。
		traceExporter, err = otlptracehttp.New(ctx)
		if err != nil {
			return noop, fmt.Errorf("otel otlp trace exporter: %w", err)
		}
		metricExporter, err = otlpmetrichttp.New(ctx)
		if err != nil {
			return noop, fmt.Errorf("otel otlp metric exporter: %w", err)
		}
	}

	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithResource(res),
		sdktrace.WithBatcher(traceExporter),
	)
	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter, sdkmetric.WithInterval(30*time.Second))),
	)
	otel.SetTracerProvider(tracerProvider)
	otel.SetMeterProvider(meterProvider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{}, propagation.Baggage{},
	))

	return func(ctx context.Context) error {
		err := tracerProvider.Shutdown(ctx)
		if mErr := meterProvider.Shutdown(ctx); err == nil {
			err = mErr
		}
		return err
	}, nil
}
