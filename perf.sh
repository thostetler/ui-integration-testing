#!/usr/bin/env bash

# This script is used to run the performance tests for the project.

# Run the performance tests
echo "Running performance tests..."

for i in {1..10}; do
    echo "Running test $i..."
    pnpm run test
done
