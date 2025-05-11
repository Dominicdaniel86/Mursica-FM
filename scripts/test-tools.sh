#!/bin/bash
# Check if the entire toolchain is installed

echo "--------------------------------------------------------------------------------"

# Detect the current environment
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if grep -q Microsoft /proc/version; then
        echo "Current Environment: WSL"
    else
        if command -v lsb_release &> /dev/null; then
            echo "Current Environment: Linux Distribution: $(lsb_release -d | cut -f2)"
        elif [[ -f /etc/os-release ]]; then
            echo "Current Environment: Linux Distribution: $(grep '^PRETTY_NAME=' /etc/os-release | cut -d= -f2 | tr -d '\"')"
        else
            echo "Current Environment: Linux Distribution: Unknown"
        fi
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Current Environment: macOS"
elif [[ "$OSTYPE" == "cygwin" || "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Current Environment: Windows"
else
    echo "Current Environment: Unknown"
fi

# Git
if command -v git &> /dev/null; then
    echo "[Git] installed - $(git --version)"
else
    echo "[Git] not installed"
fi

# Node.js
if command -v node &> /dev/null; then
    echo "[Node.js] installed - $(node --version)"
else
    echo "[Node.js] not installed"
fi

# NPM
if command -v npm &> /dev/null; then
    echo "[npm] installed - $(npm --version)"
else
    echo "[npm] not installed"
fi


# check Docker
if command -v docker &> /dev/null; then
    echo "[Docker] installed - $(docker --version)"
else
    echo "[Docker] not installed"
fi

# Docker Compose
if command -v docker compose &> /dev/null; then
    echo "[Docker Compose] installed - $(docker compose version --short)"
else
    if command -v docker-compose &> /dev/null; then
        echo "[Docker Compose] installed (legacy) - $(docker-compose --version)"
    else
        echo "[Docker Compose] not installed"
    fi
fi

# AWS CDK
if command -v cdk &> /dev/null; then
    echo "[AWS CDK] installed - $(cdk --version)"
else
    echo "[AWS CDK] not installed"
fi

# Make
if command -v make &> /dev/null; then
    echo "[Make] installed - $(make --version | head -n 1)"
else
    echo "[Make] not installed"
fi

echo "--------------------------------------------------------------------------------"
