package services

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type KnowledgeNode struct {
	FilePath string   `json:"filePath"`
	NotePath string   `json:"notePath"`
	Tags     []string `json:"tags"`
	Links    []string `json:"links"` // Paths to other related files
}

type KnowledgeService struct {
	rootPath string
	dbPath   string
	nodes    map[string]*KnowledgeNode
	mu       sync.RWMutex
}

func NewKnowledgeService() *KnowledgeService {
	return &KnowledgeService{
		nodes: make(map[string]*KnowledgeNode),
	}
}

func (s *KnowledgeService) Initialize(rootPath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.rootPath = rootPath
	s.dbPath = filepath.Join(rootPath, ".warp", "knowledge.json")

	// Crear carpeta oculta si no existe
	os.MkdirAll(filepath.Join(rootPath, ".warp"), 0755)

	if _, err := os.Stat(s.dbPath); err == nil {
		data, err := os.ReadFile(s.dbPath)
		if err == nil {
			json.Unmarshal(data, &s.nodes)
		}
	}
	return nil
}

func (s *KnowledgeService) LinkNote(filePath, notePath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	node, exists := s.nodes[filePath]
	if !exists {
		node = &KnowledgeNode{FilePath: filePath}
		s.nodes[filePath] = node
	}
	node.NotePath = notePath
	return s.save()
}

func (s *KnowledgeService) GetNode(filePath string) *KnowledgeNode {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.nodes[filePath]
}

func (s *KnowledgeService) save() error {
	data, err := json.MarshalIndent(s.nodes, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.dbPath, data, 0644)
}
