package services

import (
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type SystemService struct{}

func NewSystemService() *SystemService {
	return &SystemService{}
}

type SysStats struct {
	CPU       float64 `json:"cpu"`
	RAM       float64 `json:"ram"`
	SysCPU    float64 `json:"sysCpu"`
	SysRAM    float64 `json:"sysRam"`
	SysTotal  float64 `json:"sysTotal"`
	DiskUsed  float64 `json:"diskUsed"`
	DiskTotal float64 `json:"diskTotal"`
	Uptime    string  `json:"uptime"`
}


var startTime = time.Now()

func (s *SystemService) GetStats() (SysStats, error) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// App Stats
	ramUsed := float64(m.Alloc) / 1024 / 1024
	cpuUsage := float64(runtime.NumGoroutine()) * 0.2
	if cpuUsage > 100 { cpuUsage = 99.9 }

	// System Stats (Windows specific)
	sysCpu := 0.0
	sysFree := 0.0
	sysTotal := 16.0 // Fallback base

	// Optimized Multi-Query (RAM and CPU)
	query := "(Get-CimInstance Win32_Processor).LoadPercentage; (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory; (Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize"
	out, err := exec.Command("powershell", "-Command", query).Output()
	if err == nil {
		lines := strings.Split(strings.TrimSpace(string(out)), "\n")
		if len(lines) >= 3 {
			cpu, _ := strconv.ParseFloat(strings.TrimSpace(lines[0]), 64)
			free, _ := strconv.ParseFloat(strings.TrimSpace(lines[1]), 64)
			total, _ := strconv.ParseFloat(strings.TrimSpace(lines[2]), 64)
			sysCpu = cpu
			sysTotal = total / 1024 / 1024
			sysFree = free / 1024 / 1024
		}
	}


	// Disk Stats (C:)
	diskUsed := 0.0
	diskTotal := 0.0
	out, err = exec.Command("powershell", "-Command", "(Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\").Size; (Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\").FreeSpace").Output()
	if err == nil {
		lines := strings.Split(strings.TrimSpace(string(out)), "\n")
		if len(lines) >= 2 {
			total, _ := strconv.ParseFloat(strings.TrimSpace(lines[0]), 64)
			free, _ := strconv.ParseFloat(strings.TrimSpace(lines[1]), 64)
			diskTotal = total / 1024 / 1024 / 1024
			diskUsed = diskTotal - (free / 1024 / 1024 / 1024)
		}
	}

	return SysStats{
		CPU:       cpuUsage,
		RAM:       ramUsed,
		SysCPU:    sysCpu,
		SysRAM:    sysTotal - sysFree,
		SysTotal:  sysTotal,
		DiskUsed:  diskUsed,
		DiskTotal: diskTotal,
		Uptime:    time.Since(startTime).String(),
	}, nil

}


