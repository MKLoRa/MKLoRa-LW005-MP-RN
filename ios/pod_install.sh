#!/usr/bin/env bash
# Run CocoaPods on native arm64 with HTTP/1.1 (avoids CDN HTTP2 framing errors).
set -euo pipefail

cd "$(dirname "$0")"
export CURL_HTTP_VERSION=1.1
export LANG=en_US.UTF-8

# Prefer Apple Silicon Ruby (avoids Rosetta / x86_64 CocoaPods warning).
if /usr/bin/ruby -e 'exit(RUBY_PLATFORM.include?("arm64") ? 0 : 1)' 2>/dev/null; then
  export PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
fi

echo "arch: $(uname -m)"
echo "ruby: $(which ruby) ($(ruby -e 'print RUBY_PLATFORM'))"
echo "pod:  $(which pod) ($(pod --version))"

exec arch -arm64 /bin/bash -lc "cd \"$PWD\" && pod install --repo-update \"\$@\""
