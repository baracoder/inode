#!/bin/bash

xdg-open http://localhost:3000 &
cd opt/elasticsearch-0.20.2
bin/elasticsearch -f &

wait
