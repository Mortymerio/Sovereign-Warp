package services

import (
	"log"
	"os"
	"path/filepath"
	"github.com/fsnotify/fsnotify"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type WatchService struct {
	watcher *fsnotify.Watcher
}

func NewWatchService() *WatchService {
	return &WatchService{}
}

func (s *WatchService) StartWatching(path string) error {
	if s.watcher != nil {
		s.watcher.Close()
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	s.watcher = watcher

	go func() {
		for {
			select {
			case event, ok := <-s.watcher.Events:
				if !ok {
					return
				}
				// Emitir evento al frontend
				application.Get().Event.Emit("fs-change", event.Name)
				
				// Si es un nuevo directorio, observarlo también (recursivo simple)
				if event.Op&fsnotify.Create == fsnotify.Create {
					// Podríamos re-escanear o añadir el nuevo path
				}

			case err, ok := <-s.watcher.Errors:
				if !ok {
					return
				}
				log.Println("watcher error:", err)
			}
		}
	}()

	// Añadir el root y subdirectorios (fsnotify no es recursivo por defecto en todas las plataformas)
	return s.addRecursive(path)
}

func (s *WatchService) addRecursive(path string) error {
	return filepath.Walk(path, func(newPath string, info os.FileInfo, err error) error {
		if err != nil {

			return err
		}
		if info.IsDir() {
			return s.watcher.Add(newPath)
		}
		return nil
	})
}
