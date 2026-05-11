package services

import (
	"bufio"
	"io"
	"os/exec"
	"sync"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type TerminalService struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout io.ReadCloser
	mu     sync.Mutex
}

func NewTerminalService() *TerminalService {
	return &TerminalService{}
}

func (s *TerminalService) StartTerminal() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cmd != nil {
		return nil // Ya está corriendo
	}

	s.cmd = exec.Command("powershell", "-NoLogo", "-NoExit")
	
	var err error
	s.stdin, err = s.cmd.StdinPipe()
	if err != nil {
		return err
	}

	s.stdout, err = s.cmd.StdoutPipe()
	if err != nil {
		return err
	}

	// También capturar Stderr
	s.cmd.Stderr = s.cmd.Stdout

	err = s.cmd.Start()
	if err != nil {
		return err
	}

	// Goroutine para leer el output y mandarlo al frontend vía eventos
	go func() {
		reader := bufio.NewReader(s.stdout)
		for {
			buf := make([]byte, 1024)
			n, err := reader.Read(buf)
			if n > 0 {
				application.Get().Event.Emit("terminal-data", string(buf[:n]))
			}




			if err != nil {
				break
			}
		}
	}()

	return nil
}

func (s *TerminalService) SendInput(data string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.stdin == nil {
		return nil
	}
	_, err := s.stdin.Write([]byte(data))
	return err
}
