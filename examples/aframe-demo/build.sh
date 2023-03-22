#!/bin/bash
set -euxo pipefail
cd `/usr/bin/dirname $0`
npm run build
