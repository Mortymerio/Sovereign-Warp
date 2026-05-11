package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type AIService struct{}

func NewAIService() *AIService {
	return &AIService{}
}

type GeminiModel struct {
	Name string `json:"name"`
}

type GeminiModelsResponse struct {
	Models []GeminiModel `json:"models"`
}

func (s *AIService) GetModels(apiKey string) ([]string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models?key=%s", apiKey)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error: %s", resp.Status)
	}

	var data GeminiModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var names []string
	for _, m := range data.Models {
		// Filter only generative models
		if strings.Contains(m.Name, "gemini") {
			names = append(names, strings.Replace(m.Name, "models/", "", 1))
		}
	}
	return names, nil
}

func (s *AIService) Chat(apiKey, model, prompt string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s", model, apiKey)
	
	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	app := application.Get()
	reader := io.Reader(resp.Body)
	buffer := make([]byte, 1024)

	for {
		n, err := reader.Read(buffer)
		if n > 0 {
			chunk := string(buffer[:n])
			// Process SSE data
			lines := strings.Split(chunk, "\n")
			for _, line := range lines {
				if strings.HasPrefix(line, "data: ") {
					dataStr := strings.TrimPrefix(line, "data: ")
					var result map[string]interface{}
					if err := json.Unmarshal([]byte(dataStr), &result); err == nil {
						if candidates, ok := result["candidates"].([]interface{}); ok && len(candidates) > 0 {
							if candidate, ok := candidates[0].(map[string]interface{}); ok {
								if content, ok := candidate["content"].(map[string]interface{}); ok {
									if parts, ok := content["parts"].([]interface{}); ok && len(parts) > 0 {
										if part, ok := parts[0].(map[string]interface{}); ok {
											if text, ok := part["text"].(string); ok {
												app.Event.Emit("ai:token", text)
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}
	}

	return "Success", nil
}

func (s *AIService) GenerateTheme(prompt string) (string, error) {
	// Neural Theme Engine v2
	p := strings.ToLower(prompt)
	
	// Default: Cyber Ronin (Cyan/Purple)
	primary := "#00f2ff"
	bg := "#0a0c0e"
	accentGlow := "rgba(0, 242, 255, 0.2)"
	text := "#e0e6ed"

	if strings.Contains(p, "blood") || strings.Contains(p, "crimson") || strings.Contains(p, "red") {
		primary = "#ff0044"
		bg = "#0f0505"
		accentGlow = "rgba(255, 0, 68, 0.2)"
		text = "#fecaca"
	} else if strings.Contains(p, "forest") || strings.Contains(p, "emerald") || strings.Contains(p, "green") {
		primary = "#10b981"
		bg = "#050f0b"
		accentGlow = "rgba(16, 185, 129, 0.2)"
		text = "#d1fae5"
	} else if strings.Contains(p, "gold") || strings.Contains(p, "amber") || strings.Contains(p, "yellow") {
		primary = "#fbbf24"
		bg = "#0c0a05"
		accentGlow = "rgba(251, 191, 36, 0.2)"
		text = "#fef3c7"
	} else if strings.Contains(p, "deep sea") || strings.Contains(p, "ocean") || strings.Contains(p, "blue") {
		primary = "#3b82f6"
		bg = "#020617"
		accentGlow = "rgba(59, 130, 246, 0.2)"
		text = "#dbeafe"
	} else if strings.Contains(p, "toxic") || strings.Contains(p, "acid") || strings.Contains(p, "lime") {
		primary = "#bef264"
		bg = "#020617"
		accentGlow = "rgba(190, 242, 100, 0.2)"
		text = "#f7fee7"
	} else if strings.Contains(p, "sunset") || strings.Contains(p, "orange") {
		primary = "#f97316"
		bg = "#0c0a09"
		accentGlow = "rgba(249, 115, 22, 0.2)"
		text = "#ffedd5"
	}

	css := fmt.Sprintf(`:root {
  --accent: %s;
  --accent-dim: %s;
  --bg-main: %s;
  --bg-sidebar: %s;
  --bg-editor: %s;
  --text-main: %s;
  --border: rgba(255, 255, 255, 0.05);
}`, primary, accentGlow, bg, bg, bg, text)

	time.Sleep(800 * time.Millisecond)
	return css, nil
}

