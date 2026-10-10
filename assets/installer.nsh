!include MUI2.nsh
!include LogicLib.nsh

; Skip the finish page
!define MUI_FINISHPAGE_NOAUTOCLOSE

!macro customInstall

    ; ----- Install certificate silently -----
  DetailPrint "Installing certificate to Trusted Root..."
  ExecWait 'certutil -addstore "Root" "$INSTDIR\olo_care.cer"'

  DetailPrint "Installing certificate to Trusted Publishers..."
  ExecWait 'certutil -addstore "TrustedPublisher" "$INSTDIR\olo_care.cer"'

  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\oLo.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  
  ; Create start menu shortcut
  CreateDirectory "$SMPROGRAMS\Aura Medical Technologies Inc"
  CreateShortCut "$SMPROGRAMS\Aura Medical Technologies Inc\oLo.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  CreateShortCut "$SMPROGRAMS\Aura Medical Technologies Inc\Uninstall oLo.lnk" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"
  
  ; Launch app immediately after install
  ExecShell "open" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  
  ; Close the installer window
  Quit
!macroend

!macro customUnInstall
  ; Remove shortcuts
  Delete "$DESKTOP\oLo.lnk"
  RMDir /r "$SMPROGRAMS\Aura Medical Technologies Inc"
!macroend
