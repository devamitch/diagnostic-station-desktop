#!/bin/bash
# Post-installation script for oLo on Linux

set -e

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications || true
fi

# Update MIME database
if command -v update-mime-database >/dev/null 2>&1; then
    update-mime-database /usr/share/mime || true
fi

# Update icon cache
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor || true
fi

# Set permissions for the application
chmod 755 /opt/oLo/olo || true
chmod 755 /opt/oLo/chrome-sandbox || true

# Set SUID bit for chrome-sandbox (required for sandboxing)
if [ -f /opt/oLo/chrome-sandbox ]; then
    chmod 4755 /opt/oLo/chrome-sandbox || true
fi

# Create symlink in /usr/bin if it doesn't exist
if [ ! -L /usr/bin/olo ]; then
    ln -s /opt/oLo/olo /usr/bin/olo || true
fi

# Configure camera access for medical device functionality
if [ -d /etc/udev/rules.d ]; then
    cat > /etc/udev/rules.d/99-olo-camera.rules << 'EOF'
# oLo Camera Access Rules
# Allow access to video devices for eye health monitoring
SUBSYSTEM=="video4linux", MODE="0666"
SUBSYSTEM=="usb", ATTR{idVendor}=="*", MODE="0666"
EOF
    
    # Reload udev rules
    if command -v udevadm >/dev/null 2>&1; then
        udevadm control --reload-rules || true
        udevadm trigger || true
    fi
fi

# Add user to video group if not already a member
if command -v getent >/dev/null 2>&1; then
    if getent group video >/dev/null 2>&1; then
        if [ -n "$SUDO_USER" ]; then
            usermod -a -G video "$SUDO_USER" || true
        fi
    fi
fi

# Create application data directory
mkdir -p /var/lib/olo || true
chmod 755 /var/lib/olo || true

# Install AppArmor profile if AppArmor is available
if command -v aa-status >/dev/null 2>&1; then
    if [ -d /etc/apparmor.d ]; then
        cat > /etc/apparmor.d/opt.oLo.olo << 'EOF'
#include <tunables/global>

/opt/oLo/olo {
  #include <abstractions/base>
  #include <abstractions/audio>
  #include <abstractions/fonts>
  #include <abstractions/X>
  #include <abstractions/nameservice>
  #include <abstractions/openssl>
  
  # Application files
  /opt/oLo/** r,
  /opt/oLo/olo rix,
  
  # User data
  owner @{HOME}/.config/oLo/** rw,
  owner @{HOME}/.local/share/oLo/** rw,
  
  # System resources
  /dev/video* rw,
  /sys/devices/** r,
  /proc/*/stat r,
  /proc/sys/kernel/yama/ptrace_scope r,
  
  # Network
  network inet stream,
  network inet dgram,
}
EOF
        apparmor_parser -r /etc/apparmor.d/opt.oLo.olo || true
    fi
fi

# Display post-installation message
echo "oLo has been successfully installed!"
echo "You can launch it from your application menu or by running 'olo' in the terminal."
echo ""
echo "For camera access, you may need to log out and log back in."

exit 0