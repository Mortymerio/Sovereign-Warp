package services

import (
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type FilesystemService struct {
	rootPath string
}

func NewFilesystemService() *FilesystemService {
	return &FilesystemService{}
}

// PickFolder abre un diálogo nativo para seleccionar una carpeta.
func (s *FilesystemService) PickFolder() (string, error) {
	return application.Get().Dialog.OpenFileWithOptions(&application.OpenFileDialogOptions{
		CanChooseDirectories: true,
		CanChooseFiles:       false,
		Title:                "Select Project Folder",
	}).PromptForSingleSelection()
}

type FileNode struct {
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	IsDir    bool       `json:"isDir"`
	Size     int64      `json:"size"`
	Children []FileNode `json:"children,omitempty"`
	Language string     `json:"language,omitempty"`
}

// OpenFolder establece el root del workspace.
func (s *FilesystemService) OpenFolder(rootPath string) (*FileNode, error) {
	return s.ReadDirectory(rootPath, 2)
}

// CreateFile crea un archivo vacío.
func (s *FilesystemService) CreateFile(path string) error {
	dir := filepath.Dir(path)
	os.MkdirAll(dir, 0755)
	return os.WriteFile(path, []byte(""), 0644)
}

// CreateFolder crea un directorio.
func (s *FilesystemService) CreateFolder(path string) error {
	return os.MkdirAll(path, 0755)
}

// DeletePath elimina un archivo o carpeta.
func (s *FilesystemService) DeletePath(path string) error {
	return os.RemoveAll(path)
}

// RenamePath renombra un archivo o carpeta.
func (s *FilesystemService) RenamePath(oldPath, newPath string) error {
	return os.Rename(oldPath, newPath)
}

// ReadDirectory lee un directorio con profundidad limitada (lazy loading).
func (s *FilesystemService) ReadDirectory(path string, depth int) (*FileNode, error) {
	info, err := os.Stat(path)
	if err != nil { return nil, err }

	node := &FileNode{
		Name:  info.Name(),
		Path:  path,
		IsDir: info.IsDir(),
		Size:  info.Size(),
	}

	if !info.IsDir() || depth <= 0 {
		if !info.IsDir() {
			node.Language = detectLanguage(path)
		}
		return node, nil
	}

	entries, err := os.ReadDir(path)
	if err != nil { return node, nil }

	skipDirs := map[string]bool{
		"node_modules": true, ".git": true, "vendor": true,
		"dist": true, "__pycache__": true,
	}

	var dirs, files []FileNode

	for _, entry := range entries {
		name := entry.Name()
		if strings.HasPrefix(name, ".") && name != ".env" { continue }
		if skipDirs[name] { continue }

		fullPath := filepath.Join(path, name)
		child, err := s.ReadDirectory(fullPath, depth-1)
		if err != nil { continue }

		if child.IsDir {
			dirs = append(dirs, *child)
		} else {
			files = append(files, *child)
		}
	}

	// Ordenar: directorios primero, luego archivos, ambos alfabéticamente
	sort.Slice(dirs, func(i, j int) bool {
		return strings.ToLower(dirs[i].Name) < strings.ToLower(dirs[j].Name)
	})
	sort.Slice(files, func(i, j int) bool {
		return strings.ToLower(files[i].Name) < strings.ToLower(files[j].Name)
	})

	node.Children = append(dirs, files...)
	return node, nil
}

// ExpandDirectory carga hijos de un directorio (lazy expand en el tree).
func (s *FilesystemService) ExpandDirectory(path string) ([]FileNode, error) {
	node, err := s.ReadDirectory(path, 1)
	if err != nil { return nil, err }
	return node.Children, nil
}


