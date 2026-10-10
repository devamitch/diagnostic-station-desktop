#!/bin/bash
# Post-removal script for oLo on Linux

set -e

# Remove symlink from /usr/bin
if [ -L /usr/bin/olo ]; then
    rm -f /usr/bin/olo || true
fi

# Remove udev rules
if [ -f /etc/udev/rules.d/99-olo-camera.rules ]; then
    rm -f /etc/udev/rules.d/99-olo-camera.rules || true
    
    # Reload udev rules
    if command -v udevadm >/dev/null 2>&1; then
        udevadm control --reload-rules || true
        udevadm trigger || true
    fi
fi

# Remove AppArmor profile
if [ -f /etc/apparmor.d/opt.oLo.olo ]; then
    if command -v apparmor_parser >/dev/null 2>&1; then
        apparmor_parser -R /etc/apparmor.d/opt.oLo.olo || true
    fi
    rm -f /etc/apparmor.d/opt.oLo.olo || true
fi

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

# Ask user about keeping data (if running interactively)
if [ -t 0 ]; then
    echo "Do you want to remove user data? (y/N)"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            # Remove system data
            rm -rf /var/lib/olo || true
            
            # Remove user data for all users
            for user_home in /home/*; do
                if [ -d "$user_home/.config/oLo" ]; then
                    rm -rf "$user_home/.config/oLo" || true
                fi
                if [ -d "$user_home/.local/share/oLo" ]; then
                    rm -rf "$user_home/.local/share/oLo" || true
                fi
            done
            
            # Remove root user data if exists
            rm -rf /root/.config/oLo || true
            rm -rf /root/.local/share/oLo || true
            
            echo "User data has been removed."
            ;;
        *)
            echo "User data has been preserved."
            echo "To manually remove it later, delete:"
            echo "  ~/.config/oLo"
            echo "  ~/.local/share/oLo"
            echo "  /var/lib/olo"
            ;;
    esac
else
    # Non-interactive removal: preserve user data
    echo "User data preserved. To remove manually, delete:"
    echo "  ~/.config/oLo"
    echo "  ~/.local/share/oLo"
    echo "  /var/lib/olo"
fi

echo "oLo has been successfully removed."

exit 0