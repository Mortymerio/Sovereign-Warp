package services

import (
	"os"
	"path/filepath"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type ExtensionService struct{}

func NewExtensionService() *ExtensionService {
	return &ExtensionService{}
}

func (s *ExtensionService) LoadExtensions(rootPath string) ([]string, error) {
	extDir := filepath.Join(rootPath, ".warp", "extensions")
	
	// Crear directorio si no existe
	if _, err := os.Stat(extDir); os.IsNotExist(err) {
		os.MkdirAll(extDir, 0755)
		return []string{}, nil
	}

	files, err := os.ReadDir(extDir)
	if err != nil {
		return nil, err
	}

	var extensions []string
	for _, f := range files {
		if !f.IsDir() && filepath.Ext(f.Name()) == ".js" {
			content, err := os.ReadFile(filepath.Join(extDir, f.Name()))
			if err == nil {
				extensions = append(extensions, string(content))
			}
		}
	}

	application.Get().Logger.Info("Loaded extensions from", "path", extDir)
	return extensions, nil
}
