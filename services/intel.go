package services

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
)

type IntelService struct {
	symbols map[string]bool
	mu      sync.Mutex
	isReady bool
}

func NewIntelService() *IntelService {
	return &IntelService{
		symbols: make(map[string]bool),
	}
}

// IndexWorkspace escanea el proyecto para extraer palabras clave y símbolos.
func (s *IntelService) IndexWorkspace(rootPath string) {
	s.mu.Lock()
	s.isReady = false
	s.symbols = make(map[string]bool)
	s.mu.Unlock()

	go func() {
		// Regex para encontrar palabras (identificadores)
		re := regexp.MustCompile(`[a-zA-Z_][a-zA-Z0-9_]{3,}`)
		
		filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}

			// Ignorar carpetas pesadas
			if strings.Contains(path, "node_modules") || strings.Contains(path, ".git") || strings.Contains(path, "bin") {
				return nil
			}

			// Solo leer archivos de código comunes
			ext := filepath.Ext(path)
			if !isCodeFile(ext) {
				return nil
			}

			file, err := os.Open(path)
			if err != nil {
				return nil
			}
			defer file.Close()

			scanner := bufio.NewScanner(file)
			for scanner.Scan() {
				matches := re.FindAllString(scanner.Text(), -1)
				if len(matches) > 0 {
					s.mu.Lock()
					for _, m := range matches {
						s.symbols[m] = true
					}
					s.mu.Unlock()
				}
			}
			return nil
		})

		s.mu.Lock()
		s.isReady = true
		s.mu.Unlock()
	}()
}

type Symbol struct {
	Name string `json:"name"`
	Line int    `json:"line"`
	Type string `json:"type"` // func, class, var
}

func (s *IntelService) GetFileSymbols(path string) []Symbol {
	file, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer file.Close()

	symbols := []Symbol{}
	// Regex para detectar funciones y clases en varios lenguajes
	patterns := []struct {
		re   *regexp.Regexp
		kind string
	}{
		{regexp.MustCompile(`(?m)^func\s+([a-zA-Z_][a-zA-Z0-9_]*)`), "func"},           // Go
		{regexp.MustCompile(`(?m)^def\s+([a-zA-Z_][a-zA-Z0-9_]*)`), "func"},            // Python
		{regexp.MustCompile(`(?m)^class\s+([a-zA-Z_][a-zA-Z0-9_]*)`), "class"},         // Python/JS/TS
		{regexp.MustCompile(`(?m)^(?:export\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)`), "func"}, // JS/TS
		{regexp.MustCompile(`(?m)^(?:export\s+)?const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\(`), "func"}, // JS/TS Arrow
	}

	scanner := bufio.NewScanner(file)
	lineNum := 1
	for scanner.Scan() {
		line := scanner.Text()
		for _, p := range patterns {
			match := p.re.FindStringSubmatch(line)
			if len(match) > 1 {
				symbols = append(symbols, Symbol{
					Name: match[1],
					Line: lineNum,
					Type: p.kind,
				})
			}
		}
		lineNum++
	}

	return symbols
}

func (s *IntelService) GetSuggestions(query string) []string {

	s.mu.Lock()
	defer s.mu.Unlock()

	suggestions := []string{}
	queryLower := strings.ToLower(query)
	
	count := 0
	for sym := range s.symbols {
		if strings.Contains(strings.ToLower(sym), queryLower) {
			suggestions = append(suggestions, sym)
			count++
		}
		if count > 50 { // Limitar a 50 sugerencias por performance
			break
		}
	}
	return suggestions
}

func isCodeFile(ext string) bool {
	valid := []string{".go", ".js", ".ts", ".tsx", ".py", ".css", ".html", ".json", ".md", ".rs", ".java", ".cpp", ".h"}
	for _, v := range valid {
		if v == ext {
			return true
		}
	}
	return false
}
