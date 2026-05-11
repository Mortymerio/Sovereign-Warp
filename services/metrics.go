package services

import (
	"runtime"
	"time"
)

type MetricsService struct {
	startTime time.Time
}

func NewMetricsService() *MetricsService {
	return &MetricsService{
		startTime: time.Now(),
	}
}

type SystemMetrics struct {
	CPUUsage    float64 `json:"cpuUsage"`    // Aproximado
	MemAlloc    uint64  `json:"memAlloc"`    // Bytes asignados
	MemSys      uint64  `json:"memSys"`      // Memoria total obtenida del OS
	NumGoroutine int    `json:"numGoroutine"`
	Uptime       float64 `json:"uptime"`     // Segundos
}

func (s *MetricsService) GetMetrics() (SystemMetrics, error) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return SystemMetrics{
		CPUUsage:     0.0, // Placeholder para cálculo futuro
		MemAlloc:     m.Alloc,
		MemSys:       m.Sys,
		NumGoroutine: runtime.NumGoroutine(),
		Uptime:       time.Since(s.startTime).Seconds(),
	}, nil
}
