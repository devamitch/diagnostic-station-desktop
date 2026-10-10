#!/bin/bash
echo "Rebuilding native modules for Electron..."
npm rebuild sqlite3 --build-from-source --runtime=electron --target=38.2.1 --dist-url=https://electronjs.org/headers
echo "Done!"
