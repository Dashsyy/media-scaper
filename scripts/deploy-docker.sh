#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="sunhour012/media-scrabper"
VERSION="$(cat VERSION)"

echo "Building ${IMAGE_NAME}:${VERSION}"
docker build -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" .

echo "Pushing ${IMAGE_NAME}:${VERSION}"
docker push "${IMAGE_NAME}:${VERSION}"

echo "Pushing ${IMAGE_NAME}:latest"
docker push "${IMAGE_NAME}:latest"
