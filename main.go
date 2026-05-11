package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"

	"sovereign-warp/services"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := application.New(application.Options{
		Name:        "M3Warp",
		Description: "High-Performance Code Editor",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Services: []application.Service{
			application.NewService(services.NewFilesystemService()),
			application.NewService(services.NewEditorService()),
			application.NewService(services.NewSearchService()),
			application.NewService(services.NewSettingsService()),
			application.NewService(services.NewIntelService()),
			application.NewService(services.NewGitService()),
			application.NewService(services.NewTerminalService()),
			application.NewService(services.NewWatchService()),
			application.NewService(services.NewKnowledgeService()),
			application.NewService(services.NewAIService()),
			application.NewService(services.NewSystemService()),
			application.NewService(services.NewHistoryService()),
			application.NewService(services.NewExtensionService()),
			application.NewService(services.NewMetricsService()),
		},

	})









	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:      "main",
		Title:     "Sovereign Warp",
		Width:     1400,
		Height:    900,
		MinWidth:  800,
		MinHeight: 600,
		Frameless: true,
		Windows: application.WindowsWindow{
			Theme: application.SystemDefault,
		},
		URL: "/",
	})




	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

