package services

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"sort"
	"time"
)

type HistoryService struct{}

func NewHistoryService() *HistoryService {
	return &HistoryService{}
}

type HistorySnapshot struct {
	Timestamp int64  `json:"timestamp"`
	Label     string `json:"label"`
}

// SaveSnapshot guarda una copia del archivo en la carpeta de historia.
func (s *HistoryService) SaveSnapshot(rootPath, filePath, content string) error {
	historyDir := filepath.Join(rootPath, ".warp", "history")
	
	// Creamos un ID único basado en el path relativo
	rel, err := filepath.Rel(rootPath, filePath)
	if err != nil {
		rel = filePath
	}
	id := base64.StdEncoding.EncodeToString([]byte(rel))
	fileHistoryDir := filepath.Join(historyDir, id)
	
	if err := os.MkdirAll(fileHistoryDir, 0755); err != nil {
		return err
	}

	timestamp := time.Now().Unix()
	dest := filepath.Join(fileHistoryDir, fmt.Sprintf("%d.txt", timestamp))
	
	return ioutil.WriteFile(dest, []byte(content), 0644)
}

// GetSnapshots devuelve la lista de snapshots para un archivo.
func (s *HistoryService) GetSnapshots(rootPath, filePath string) ([]HistorySnapshot, error) {
	rel, err := filepath.Rel(rootPath, filePath)
	if err != nil {
		rel = filePath
	}
	id := base64.StdEncoding.EncodeToString([]byte(rel))
	fileHistoryDir := filepath.Join(rootPath, ".warp", "history", id)

	files, err := ioutil.ReadDir(fileHistoryDir)
	if err != nil {
		return []HistorySnapshot{}, nil
	}

	var snapshots []HistorySnapshot
	for _, f := range files {
		if f.IsDir() { continue }
		var ts int64
		fmt.Sscanf(f.Name(), "%d.txt", &ts)
		if ts > 0 {
			snapshots = append(snapshots, HistorySnapshot{
				Timestamp: ts,
				Label:     time.Unix(ts, 0).Format("2006-01-02 15:04:05"),
			})
		}
	}

	// Ordenar por más reciente primero
	sort.Slice(snapshots, func(i, j int) bool {
		return snapshots[i].Timestamp > snapshots[j].Timestamp
	})

	return snapshots, nil
}

// GetSnapshotContent devuelve el contenido de una versión específica.
func (s *HistoryService) GetSnapshotContent(rootPath, filePath string, timestamp int64) (string, error) {
	rel, err := filepath.Rel(rootPath, filePath)
	if err != nil {
		rel = filePath
	}
	id := base64.StdEncoding.EncodeToString([]byte(rel))
	snapshotPath := filepath.Join(rootPath, ".warp", "history", id, fmt.Sprintf("%d.txt", timestamp))

	data, err := ioutil.ReadFile(snapshotPath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
