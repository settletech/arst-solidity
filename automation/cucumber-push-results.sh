#!/bin/sh
# Execution enviroment can be added based on current branch
# docker run -it --rm -u $UID -v $(pwd):/app hiptest/hiptest-publisher --config-file=htpub-push-results.conf --execution-environment=local
docker run -it --rm -u $UID -v $(pwd):/app hiptest/hiptest-publisher --config-file=htpub-push-results.conf