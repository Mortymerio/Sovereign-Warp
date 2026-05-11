package services

type SettingsService struct{}

func NewSettingsService() *SettingsService {
	return &SettingsService{}
}

func (s *SettingsService) GetSettings() (map[string]string, error) {
	return map[string]string{
		"theme": "cyber-ronin",
		"fontSize": "14",
	}, nil
}
