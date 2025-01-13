#!/bin/sh
docker run -it --rm -u $UID -v $(pwd):/app hiptest/hiptest-publisher --config-file=htpub-export-scenarios.conf