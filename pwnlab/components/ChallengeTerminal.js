import React, { useEffect, useRef, useState } from 'react';
import styles from './ChallengeTerminal.module.css';

export default function ChallengeTerminal({ challengeId, challengeName, storagePath, onClose }) {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonInstance = useRef(null);
  const inputBuffer = useRef('');
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const isExecuting = useRef(false);

  const [mounted, setMounted] = useState(false);

  const prompt = '\r\n\x1b[1;32moperator@pwnlab\x1b[0m:\x1b[1;34m~/' + (storagePath || 'target') + '\x1b[0m$ ';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !terminalRef.current) return;

    let term;
    let fitAddon;

    async function initTerminal() {
      // Dynamic import of xterm and its addons to prevent SSR errors
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      await import('xterm/css/xterm.css');

      term = new Terminal({
        theme: {
          background: '#090909',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          cursorAccent: '#000000',
          selectionBackground: 'rgba(255, 255, 255, 0.25)',
          black: '#1e1e1e',
          red: '#f44747',
          green: '#6a9955',
          yellow: '#dcdcaa',
          blue: '#569cd6',
          magenta: '#c586c0',
          cyan: '#4ec9b0',
          white: '#e5e5e5',
        },
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: 13,
        lineHeight: 1.2,
        cursorBlink: true,
        convertEol: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      terminalRef.current.innerHTML = '';
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermInstance.current = term;
      fitAddonInstance.current = fitAddon;

      // Welcome Banner
      term.writeln('\x1b[1;37m=== pwnlab Sandbox Terminal Target: ' + (challengeName || 'Challenge') + ' ===\x1b[0m');
      term.writeln('\x1b[90mType "help" for available commands or explore directory files with "ls -la".\x1b[0m');
      term.write(prompt);

      // Handle Key Events
      term.onData(async (data) => {
        if (isExecuting.current) return;

        // Enter key
        if (data === '\r') {
          const cmd = inputBuffer.current.trim();
          term.writeln('');

          if (cmd.length > 0) {
            history.current.push(cmd);
            historyIndex.current = history.current.length;

            if (cmd === 'clear') {
              term.clear();
              inputBuffer.current = '';
              term.write(prompt);
              return;
            }

            isExecuting.current = true;
            try {
              const res = await fetch('/api/challenges/' + challengeId + '/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd }),
              });
              const json = await res.json();
              if (json.output) {
                term.write(json.output);
              }
            } catch (err) {
              term.writeln('\x1b[31mCommand execution failed: ' + err.message + '\x1b[0m');
            } finally {
              isExecuting.current = false;
            }
          }

          inputBuffer.current = '';
          term.write(prompt);
          return;
        }

        // Backspace
        if (data === '\x7f' || data === '\b') {
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.write('\b \b');
          }
          return;
        }

        // Up arrow (History prev)
        if (data === '\x1b[A') {
          if (history.current.length > 0 && historyIndex.current > 0) {
            historyIndex.current--;
            const prevCmd = history.current[historyIndex.current] || '';
            // Clear current input on line
            while (inputBuffer.current.length > 0) {
              term.write('\b \b');
              inputBuffer.current = inputBuffer.current.slice(0, -1);
            }
            inputBuffer.current = prevCmd;
            term.write(prevCmd);
          }
          return;
        }

        // Down arrow (History next)
        if (data === '\x1b[B') {
          if (historyIndex.current < history.current.length - 1) {
            historyIndex.current++;
            const nextCmd = history.current[historyIndex.current] || '';
            while (inputBuffer.current.length > 0) {
              term.write('\b \b');
              inputBuffer.current = inputBuffer.current.slice(0, -1);
            }
            inputBuffer.current = nextCmd;
            term.write(nextCmd);
          } else {
            historyIndex.current = history.current.length;
            while (inputBuffer.current.length > 0) {
              term.write('\b \b');
              inputBuffer.current = inputBuffer.current.slice(0, -1);
            }
          }
          return;
        }

        // Ctrl+C
        if (data === '\x03') {
          inputBuffer.current = '';
          term.writeln('^C');
          term.write(prompt);
          return;
        }

        // Printable characters
        if (data >= ' ' || data === '\t') {
          inputBuffer.current += data;
          term.write(data);
        }
      });
    }

    initTerminal();

    const handleResize = () => {
      if (fitAddonInstance.current) {
        try {
          fitAddonInstance.current.fit();
        } catch {}
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (xtermInstance.current) {
        xtermInstance.current.dispose();
      }
    };
  }, [mounted, challengeId, challengeName, storagePath, prompt]);

  return (
    <div className={styles.terminalWrapper}>
      <div className={styles.terminalHeader}>
        <div className={styles.terminalTitle}>
          <div className={styles.terminalDots}>
            <span className={styles.dotRed} />
            <span className={styles.dotYellow} />
            <span className={styles.dotGreen} />
          </div>
          <span>&gt;_ interactive terminal // {storagePath || 'sandbox'}</span>
        </div>

        <div className={styles.terminalActions}>
          <button
            type="button"
            onClick={() => {
              if (xtermInstance.current) {
                xtermInstance.current.clear();
                inputBuffer.current = '';
                xtermInstance.current.write(prompt);
              }
            }}
            className={styles.clearBtn}
          >
            clear
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className={styles.helpBtn}>
              close terminal ✕
            </button>
          )}
        </div>
      </div>

      <div ref={terminalRef} className={styles.terminalContainer} />

      <div className={styles.terminalFooter}>
        <span>status: online &bull; xterm-256color</span>
        <span>sandbox: /home/misery/pwnlab/challenges/{storagePath}</span>
      </div>
    </div>
  );
}
