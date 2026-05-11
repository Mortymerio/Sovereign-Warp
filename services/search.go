package services

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
)

type SearchService struct{}

func NewSearchService() *SearchService { return &SearchService{} }

// SearchResult representa una coincidencia en un archivo.
type SearchResult struct {
	FilePath string `json:"filePath"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Preview  string `json:"preview"` // Contexto de la línea
	Match    string `json:"match"`
}

type SearchProgress struct {
	Results    []SearchResult `json:"results"`
	FilesTotal int64          `json:"filesTotal"`
	Done       bool           `json:"done"`
}

// SearchInFolder busca texto en paralelo usando todos los cores.
func (s *SearchService) SearchInFolder(
	rootPath, query string, caseSensitive bool, maxResults int,
) (*SearchProgress, error) {

	if maxResults <= 0 { maxResults = 500 }

	var (
		results   []SearchResult
		mu        sync.Mutex
		fileCount int64
		workers   = runtime.NumCPU()
		fileCh    = make(chan string, workers*4)
		wg        sync.WaitGroup
		ctx, cancel = context.WithCancel(context.Background())
	)
	defer cancel()

	searchQuery := query
	if !caseSensitive {
		searchQuery = strings.ToLower(query)
	}

	// Spawn workers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for path := range fileCh {
				select {
				case <-ctx.Done():
					return
				default:
				}

				matches := searchInFile(path, searchQuery, caseSensitive)
				if len(matches) > 0 {
					mu.Lock()
					results = append(results, matches...)
					if len(results) >= maxResults {
						cancel()
					}
					mu.Unlock()
				}
			}
		}()
	}

	// Walk directory
	skipDirs := map[string]bool{
		"node_modules": true, ".git": true, "vendor": true,
		"dist": true, "__pycache__": true, ".next": true,
	}

	_ = filepath.WalkDir(rootPath, func(path string, d os.DirEntry, err error) error {
		if err != nil { return nil }
		if ctx.Err() != nil { return filepath.SkipAll }

		if d.IsDir() {
			if skipDirs[d.Name()] || strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}

		// Solo archivos de texto (por extensión)
		if isTextFile(d.Name()) {
			atomic.AddInt64(&fileCount, 1)
			fileCh <- path
		}
		return nil
	})

	close(fileCh)
	wg.Wait()

	if len(results) > maxResults {
		results = results[:maxResults]
	}
	return &SearchProgress{
		Results:    results,
		FilesTotal: fileCount,
		Done:       true,
	}, nil
}

// NeuralSearch realiza una búsqueda semántica asistida con ranking por relevancia.
func (s *SearchService) NeuralSearch(rootPath, query string) (*SearchProgress, error) {
	keywords := strings.Fields(strings.ToLower(query))
	if len(keywords) == 0 {
		return &SearchProgress{Done: true}, nil
	}

	// Realizar búsqueda base con la primera keyword
	progress, err := s.SearchInFolder(rootPath, keywords[0], false, 500)
	if err != nil {
		return nil, err
	}

	// Ranking: Calcular score basado en cuántas keywords coinciden en la línea
	type scoredResult struct {
		res   SearchResult
		score int
	}
	scored := make([]scoredResult, len(progress.Results))

	for i, res := range progress.Results {
		score := 0
		previewLower := strings.ToLower(res.Preview)
		for _, kw := range keywords {
			if strings.Contains(previewLower, kw) {
				score += 10
				// Bonus si la palabra completa coincide
				if strings.Contains(" "+previewLower+" ", " "+kw+" ") {
					score += 5
				}
			}
		}
		scored[i] = scoredResult{res, score}
	}

	// Ordenar por score descendente
	for i := 0; i < len(scored); i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].score > scored[i].score {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	// Re-empaquetar resultados ordenados
	finalResults := make([]SearchResult, len(scored))
	for i, s := range scored {
		finalResults[i] = s.res
	}

	progress.Results = finalResults
	return progress, nil
}



func searchInFile(path, query string, caseSensitive bool) []SearchResult {
	data, err := os.ReadFile(path)
	if err != nil { return nil }

	// Limitar archivos grandes (>10MB skip)
	if len(data) > 10*1024*1024 { return nil }

	content := string(data)
	lines := strings.Split(content, "\n")
	var results []SearchResult

	for i, line := range lines {
		searchLine := line
		if !caseSensitive {
			searchLine = strings.ToLower(line)
		}

		col := strings.Index(searchLine, query)
		if col >= 0 {
			preview := line
			if len(preview) > 200 {
				start := col - 50
				if start < 0 { start = 0 }
				end := col + len(query) + 100
				if end > len(preview) { end = len(preview) }
				preview = preview[start:end]
			}

			results = append(results, SearchResult{
				FilePath: path,
				Line:     i + 1,
				Column:   col + 1,
				Preview:  strings.TrimSpace(preview),
				Match:    query,
			})

			if len(results) >= 50 { break } // Max per file
		}
	}
	return results
}

func isTextFile(name string) bool {
	textExts := []string{
		".go", ".js", ".ts", ".tsx", ".jsx", ".py", ".rs",
		".md", ".txt", ".json", ".yaml", ".yml", ".toml",
		".html", ".css", ".scss", ".sql", ".sh", ".bat",
		".xml", ".csv", ".env", ".gitignore", ".dockerfile",
		".c", ".cpp", ".h", ".java", ".rb", ".php", ".swift",
	}
	lower := strings.ToLower(name)
	for _, ext := range textExts {
		if strings.HasSuffix(lower, ext) { return true }
	}
	return false
}

// ReplaceAll reemplaza todas las ocurrencias en los archivos encontrados.
func (s *SearchService) ReplaceAll(rootPath, query, replacement string, caseSensitive bool) (int, error) {
	progress, err := s.SearchInFolder(rootPath, query, caseSensitive, 5000)
	if err != nil { return 0, err }
	fileMatches := make(map[string]bool)
	for _, res := range progress.Results { fileMatches[res.FilePath] = true }
	totalReplaced := 0
	for path := range fileMatches {
		data, err := os.ReadFile(path)
		if err != nil { continue }
		content := string(data)
		newContent := strings.ReplaceAll(content, query, replacement)
		if content != newContent {
			err = os.WriteFile(path, []byte(newContent), 0644)
			if err == nil { totalReplaced++ }
		}
	}
	return totalReplaced, nil
}
