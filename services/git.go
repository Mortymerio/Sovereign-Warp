package services

import (
	"fmt"
	"os/exec"
	"strings"
)

type GitService struct{}

func NewGitService() *GitService {
	return &GitService{}
}

func (s *GitService) isGitRepo(rootPath string) bool {
	cmd := exec.Command("git", "rev-parse", "--is-inside-work-tree")
	cmd.Dir = rootPath
	err := cmd.Run()
	return err == nil
}

// GetCurrentBranch devuelve el nombre de la rama actual en el rootPath.
func (s *GitService) GetCurrentBranch(rootPath string) (string, error) {
	if !s.isGitRepo(rootPath) {
		return "No Repo", nil
	}
	cmd := exec.Command("git", "branch", "--show-current")
	cmd.Dir = rootPath
	out, err := cmd.Output()
	if err != nil {
		return "", nil // Silenciar error de git
	}
	return strings.TrimSpace(string(out)), nil
}

// GetStatusSummary devuelve un resumen de cambios (ej: "5 files changed").
func (s *GitService) GetStatusSummary(rootPath string) (string, error) {
	if !s.isGitRepo(rootPath) {
		return "Not a Git Repository", nil
	}
	cmd := exec.Command("git", "status", "--short")
	cmd.Dir = rootPath
	out, err := cmd.Output()
	if err != nil {
		return "Git Error", nil
	}
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) == 1 && lines[0] == "" {
		return "Clean", nil
	}
	return strings.TrimSpace(string(out)), nil
}

type LineDiff struct {
	Line int    `json:"line"`
	Type string `json:"type"`
}

func (s *GitService) GetLineDiff(rootPath, filePath string) ([]LineDiff, error) {
	if !s.isGitRepo(rootPath) {
		return []LineDiff{}, nil
	}
	cmd := exec.Command("git", "diff", "-U0", "--", filePath)
	cmd.Dir = rootPath
	out, err := cmd.Output()
	if err != nil {
		return []LineDiff{}, nil
	}

	var diffs []LineDiff
	lines := strings.Split(string(out), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "@@") {
			parts := strings.Split(line, " ")
			if len(parts) < 3 {
				continue
			}
			plusPart := strings.TrimPrefix(parts[2], "+")
			commaIdx := strings.Index(plusPart, ",")
			
			var startLine int
			var count int
			if commaIdx == -1 {
				fmt.Sscanf(plusPart, "%d", &startLine)
				count = 1
			} else {
				fmt.Sscanf(plusPart[:commaIdx], "%d", &startLine)
				fmt.Sscanf(plusPart[commaIdx+1:], "%d", &count)
			}

			diffType := "modified"
			if strings.Contains(parts[1], ",0") {
				diffType = "added"
			}

			for i := 0; i < count; i++ {
				diffs = append(diffs, LineDiff{
					Line: startLine + i,
					Type: diffType,
				})
			}
		}
	}
	return diffs, nil
}

type CommitInfo struct {
	Hash    string `json:"hash"`
	Author  string `json:"author"`
	Date    string `json:"date"`
	Message string `json:"message"`
}

func (s *GitService) GetCommitHistory(rootPath string, count int) ([]CommitInfo, error) {
	if !s.isGitRepo(rootPath) {
		return []CommitInfo{}, nil
	}
	format := "%H|%an|%ar|%s"
	cmd := exec.Command("git", "log", "-n", fmt.Sprintf("%d", count), "--pretty=format:"+format)
	cmd.Dir = rootPath
	out, err := cmd.Output()
	if err != nil {
		return []CommitInfo{}, nil
	}

	var commits []CommitInfo
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	for _, line := range lines {
		parts := strings.Split(line, "|")
		if len(parts) >= 4 {
			commits = append(commits, CommitInfo{
				Hash:    parts[0],
				Author:  parts[1],
				Date:    parts[2],
				Message: parts[3],
			})
		}
	}
	return commits, nil
}

type BlameInfo struct {
	Author  string `json:"author"`
	Date    string `json:"date"`
	Hash    string `json:"hash"`
	Message string `json:"message"`
}

func (s *GitService) GetLineBlame(rootPath, filePath string, line int) (BlameInfo, error) {
	if !s.isGitRepo(rootPath) {
		return BlameInfo{Author: "No Git"}, nil
	}
	cmd := exec.Command("git", "blame", "-L", fmt.Sprintf("%d,%d", line, line), "--porcelain", filePath)
	cmd.Dir = rootPath
	out, err := cmd.Output()
	if err != nil {
		return BlameInfo{Author: "Unknown"}, nil
	}

	info := BlameInfo{}
	lines := strings.Split(string(out), "\n")
	for _, l := range lines {
		if strings.HasPrefix(l, "author ") {
			info.Author = strings.TrimPrefix(l, "author ")
		}
		if strings.HasPrefix(l, "summary ") {
			info.Message = strings.TrimPrefix(l, "summary ")
		}
	}
	if len(lines) > 0 {
		info.Hash = strings.Split(lines[0], " ")[0]
	}
	return info, nil
}
