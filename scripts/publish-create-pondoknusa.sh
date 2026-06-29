#!/usr/bin/env bash
# Publish the unscoped create-pondoknusa scaffold (npm create pondoknusa).
# Granular NPM_TOKEN must include this package name, not just @pondoknusa/*.
#
#   npm login
#   ./scripts/publish-create-pondoknusa.sh

set -euo pipefail

cd "$(dirname "$0")/.."

npm run build --workspace=@pondoknusa/cli
npm publish --workspace=create-pondoknusa --access public
echo "✅ create-pondoknusa@$(node -p "require('./packages/create-pondoknusa/package.json').version")"