export DISPLAY=':99.0'
export ELECTRON_ENABLE_LOGGING=1
export DEBUG=*
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
