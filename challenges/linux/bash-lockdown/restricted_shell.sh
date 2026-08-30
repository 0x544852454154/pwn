#!/bin/bash
export PATH=/restricted/bin
echo "=== SECURE BASH CONSOLE ==="
echo "Type 'help' for available commands."

while true; do
    read -p "operator> " cmd args
    case "$cmd" in
        "help")
            echo "Commands: ping, date, echo, debug, exit"
            ;;
        "date")
            /bin/date
            ;;
        "echo")
            echo "$args"
            ;;
        "debug")
            eval "$args"
            ;;
        "exit")
            exit 0
            ;;
        *)
            echo "Command blocked by security policy."
            ;;
    esac
done
