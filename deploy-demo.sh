#!/bin/bash
set -euxo pipefail
cd `/usr/bin/dirname $0`

# _OPTS="--dryrun"
_OPTS=""

aws --profile metaverse-dev-deploy s3 sync ${_OPTS} \
      --region ap-northeast-1 \
      --delete \
      --exclude "*.DS_Store" \
      --exclude "*.clean" \
      --cache-control "max-age=60"\
      ./examples/getstarted s3://static.verseengine.cloud/examples/getstarted

aws --profile metaverse-dev-deploy s3 sync ${_OPTS} \
      --region ap-northeast-1 \
      --delete \
      --exclude "*.DS_Store" \
      --exclude "*.clean" \
      --cache-control "max-age=60"\
      ./examples/verse-three-tips s3://static.verseengine.cloud/examples/verse-three-tips

aws --profile metaverse-dev-deploy s3 sync ${_OPTS} \
      --region ap-northeast-1 \
      --delete \
      --exclude "*.DS_Store" \
      --exclude "*.clean" \
      --cache-control "max-age=31536000" \
      ./examples/asset s3://static.verseengine.cloud/examples/asset

aws --profile metaverse-dev-deploy s3 sync ${_OPTS} \
      --region ap-northeast-1 \
      --delete \
      --exclude "*.DS_Store" \
      --exclude "temp/*" \
      --exclude "*.clean" \
      --cache-control "max-age=60"\
      ./examples/aframe-demo/dist s3://static.verseengine.cloud/examples/aframe-demo/dist

aws --profile metaverse-dev-deploy s3 sync ${_OPTS} \
      --region ap-northeast-1 \
      --delete \
      --exclude "*.DS_Store" \
      --exclude "*.clean" \
      --cache-control "max-age=31536000" \
      ./examples/aframe-demo/asset s3://static.verseengine.cloud/examples/aframe-demo/asset

aws --profile metaverse-dev-deploy s3 cp \
./examples/aframe-demo/setup-verse.js s3://static.verseengine.cloud/examples/aframe-demo/setup-verse.js
aws --profile metaverse-dev-deploy s3 cp \
./examples/aframe-demo/bar.html s3://static.verseengine.cloud/examples/aframe-demo/bar.html
aws --profile metaverse-dev-deploy s3 cp \
./examples/aframe-demo/ornament.js s3://static.verseengine.cloud/examples/aframe-demo/ornament.js
aws --profile metaverse-dev-deploy s3 cp \
./examples/aframe-demo/index.html s3://static.verseengine.cloud/examples/aframe-demo/index.html

