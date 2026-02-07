#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="sunhour012/media-scrabper"
VERSION="$(cat VERSION)"

# We use buildx to target the Intel architecture (amd64) for your 2017 machine
# and the ARM architecture (arm64) for modern Macs.
PLATFORMS="linux/amd64,linux/arm64"

echo "Building and Pushing ${IMAGE_NAME}:${VERSION} for platforms: ${PLATFORMS}"

# 'buildx' can build and push in one command. 
# This creates a "Manifest List" so the 2017 Mac automatically pulls the right version.
docker buildx build \
  --platform "${PLATFORMS}" \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  --push .

echo "Done! Images push to repo"