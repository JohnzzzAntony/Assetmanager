#!/bin/bash
# Persistent npm install - survives parent process termination
cd /home/z/my-project
echo "START $(date)" > /tmp/install_status.txt
npm install --no-audit --no-fund --loglevel=error >> /tmp/npm_install_persistent.log 2>&1
EXIT=$?
echo "EXIT=$EXIT $(date)" >> /tmp/install_status.txt
if [ -f node_modules/.bin/next ]; then
  echo "NEXT_FOUND" >> /tmp/install_status.txt
fi
