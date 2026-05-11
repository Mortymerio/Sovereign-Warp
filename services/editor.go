package services

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
)


// EditorService maneja la lectura paginada de archivos grandes.
type EditorService struct {
	openFiles map[string]*openFile
	mu        sync.RWMutex
}

type openFile struct {
	path     string
	file     *os.File
	lineIndex []int64 // offset de cada línea
	totalLines int
	size     int64
}

// FileChunk es lo que devolvemos al frontend.
type FileChunk struct {
	Lines      []string `json:"lines"`
	StartLine  int      `json:"startLine"`
	EndLine    int      `json:"endLine"`
	TotalLines int      `json:"totalLines"`
	FileSize   int64    `json:"fileSize"`
	Encoding   string   `json:"encoding"`
}

type FileMetadata struct {
	Path       string `json:"path"`
	Size       int64  `json:"size"`
	TotalLines int    `json:"totalLines"`
	Language   string `json:"language"`
	ReadOnly   bool   `json:"readOnly"`
}

func NewEditorService() *EditorService {
	return &EditorService{
		openFiles: make(map[string]*openFile),
	}
}

// OpenFile indexa las posiciones de cada línea para acceso O(1).
// Esto toma ~200ms para un archivo de 1GB (solo lee offsets).
func (s *EditorService) OpenFile(path string) (*FileMetadata, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Si ya está abierto, devolver metadata
	if of, ok := s.openFiles[path]; ok {
		return &FileMetadata{
			Path: path, Size: of.size,
			TotalLines: of.totalLines,
			Language: detectLanguage(path),
		}, nil
	}

	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open file: %w", err)
	}

	info, _ := f.Stat()

	// Indexar offsets de línea
	offsets := []int64{0}
	reader := bufio.NewReaderSize(f, 64*1024) // 64KB buffer
	var offset int64

	for {
		line, err := reader.ReadBytes('\n')
		offset += int64(len(line))
		if err == io.EOF {
			break
		}
		if err != nil {
			f.Close()
			return nil, err
		}
		offsets = append(offsets, offset)
	}

	of := &openFile{
		path:      path,
		file:      f,
		lineIndex: offsets,
		totalLines: len(offsets),
		size:      info.Size(),
	}
	s.openFiles[path] = of

	return &FileMetadata{
		Path: path, Size: info.Size(),
		TotalLines: of.totalLines,
		Language: detectLanguage(path),
	}, nil
}

// ReadLines devuelve un rango de líneas. El frontend pide chunks de ~1000 líneas.
func (s *EditorService) ReadLines(path string, from, to int) (*FileChunk, error) {
	s.mu.Lock()
	of, exists := s.openFiles[path]
	s.mu.Unlock()

	if !exists {
		// Auto-open if not open (prevents errors after backend restart/HMR)
		_, err := s.OpenFile(path)
		if err != nil {
			return nil, fmt.Errorf("file not open and auto-open failed: %v", err)
		}
		s.mu.Lock()
		of = s.openFiles[path]
		s.mu.Unlock()
	}

	if of == nil {
		return nil, fmt.Errorf("file handle is null for: %s", path)
	}

	// Clamp
	if from < 1 { from = 1 }
	if to > of.totalLines { to = of.totalLines }
	if from > to { return &FileChunk{Lines: []string{}, StartLine: from, EndLine: to, TotalLines: of.totalLines}, nil }

	startOffset := of.lineIndex[from-1]
	var endOffset int64
	if to < of.totalLines {
		endOffset = of.lineIndex[to]
	} else {
		endOffset = of.size
	}

	buf := make([]byte, endOffset-startOffset)
	_, err := of.file.ReadAt(buf, startOffset)
	if err != nil && err != io.EOF {
		return nil, err
	}

	rawLines := strings.Split(string(buf), "\n")
	// Limpiar último elemento vacío
	if len(rawLines) > 0 && rawLines[len(rawLines)-1] == "" {
		rawLines = rawLines[:len(rawLines)-1]
	}

	return &FileChunk{
		Lines:      rawLines,
		StartLine:  from,
		EndLine:    to,
		TotalLines: of.totalLines,
		FileSize:   of.size,
		Encoding:   "utf-8",
	}, nil
}

// SaveFile guarda contenido completo (para archivos normales).
func (s *EditorService) SaveFile(path, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// CloseFile libera el handle del archivo.
func (s *EditorService) CloseFile(path string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if of, ok := s.openFiles[path]; ok {
		of.file.Close()
		delete(s.openFiles, path)
	}
}

func detectLanguage(path string) string {
	ext := map[string]string{
		".go": "go", ".js": "javascript", ".ts": "typescript",
		".tsx": "typescriptreact", ".py": "python", ".rs": "rust",
		".md": "markdown", ".json": "json", ".css": "css",
		".html": "html", ".sql": "sql", ".yaml": "yaml",
		".yml": "yaml", ".toml": "toml", ".sh": "shell",
	}
	for e, lang := range ext {
		if strings.HasSuffix(path, e) { return lang }
	}
	return "plaintext"
}
