#!/bin/bash

# Print the welcome message
echo "Setting up Alta Bross Location Tracking Tool..."

# Update package list
echo "[*] Updating package list..."
apt-get update -y

# Install Python3 and pip if not installed
echo "[*] Checking for Python3 and pip..."
if ! command -v python3 &> /dev/null; then
    echo "[!] Python3 is not installed. Installing Python3..."
    apt-get install python3 python3-pip -y
else
    echo "[*] Python3 is already installed."
fi

# Install Node.js and npm if not installed
echo "[*] Checking for Node.js and npm..."
if ! command -v node &> /dev/null; then
    echo "[!] Node.js is not installed. Installing Node.js and npm..."
    apt install npm
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    apt-get install -y nodejs
else
    echo "[*] Node.js is already installed."
fi

# Install Python dependencies
echo "[*] Installing Python dependencies..."
pip3 install --upgrade pip
pip3 install termcolor requests

# Install Node.js dependencies
echo "[*] Installing Node.js dependencies..."
npm install express socket.io axios ua-parser-js useragent geoip-lite figlet chalk

# Final instructions
echo "[*] Installation complete!"
echo "Now you can run the tool by executing: python3 Location.py"
echo "Remember to start the server using: node track.js for the tracking to work."
