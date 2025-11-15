#!/bin/bash

# Competitor Performance Analysis with Lighthouse using sitespeed.io
# This script runs comprehensive performance tests including Lighthouse metrics
# on competitor sites and generates comparative reports

set -e

# Configuration
ITERATIONS=7  # Number of test runs per URL (7-11 recommended for statistical accuracy)
OUTPUT_DIR="./sitespeed-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULT_DIR="${OUTPUT_DIR}/${TIMESTAMP}"

# Docker image - using the +1 variant which includes Lighthouse and PageSpeed Insights
DOCKER_IMAGE="sitespeedio/sitespeed.io:38.5.0-plus1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Competitor Performance Analysis${NC}"
echo -e "${BLUE}with Lighthouse & Core Web Vitals${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "  - Iterations per URL: ${ITERATIONS}"
echo "  - Output directory: ${RESULT_DIR}"
echo "  - Docker image: ${DOCKER_IMAGE}"
echo "  - Plugins: Lighthouse, PageSpeed Insights"
echo ""

# Create output directory
mkdir -p "${RESULT_DIR}"

# Competitor sites configuration
declare -A competitors=(
  ["arXiv_home"]="https://arxiv.org"
  ["arXiv_search"]="https://arxiv.org/search/?query=black+holes&searchtype=all&abstracts=show&order=-announced_date_first&size=25"
  ["arXiv_article"]="https://arxiv.org/abs/0704.0001"

  ["INSPIRE-HEP_home"]="https://inspirehep.net"
  ["INSPIRE-HEP_search"]="https://inspirehep.net/literature?sort=mostrecent&size=25&page=1&q=black%20holes"
  ["INSPIRE-HEP_article"]="https://inspirehep.net/literature/3082719"

  ["SemanticScholar_home"]="https://www.semanticscholar.org"
  ["SemanticScholar_search"]="https://www.semanticscholar.org/search?q=black+holes&sort=relevance"
  ["SemanticScholar_article"]="https://www.semanticscholar.org/paper/Particle-creation-by-black-holes-Hawking/6b9d83c086ea962b6e7ef5caaaf2c241a4d47ff8"

  ["GoogleScholar_home"]="https://scholar.google.com"
  ["GoogleScholar_search"]="https://scholar.google.com/scholar?q=black+holes&hl=en&as_sdt=0,5"

  ["SciX_home"]="https://scixplorer.org"
  ["SciX_search"]="https://scixplorer.org/search?n=10&p=1&q=black+holes&sort=score+desc&sort=date+desc"
  ["SciX_article"]="https://scixplorer.org/abs/2022ApJ...930L..12E/abstract"

  ["GeoScienceWorld_home"]="https://pubs.geoscienceworld.org"
  ["GeoScienceWorld_search"]="https://pubs.geoscienceworld.org/search-results?page=1&quicknav=1&q=black%20holes"
  ["GeoScienceWorld_article"]="https://pubs.geoscienceworld.org/gsa/gsabulletin/article-abstract/121/3-4/574/2374/Supply-and-dispersal-of-flood-sediment-from-a?redirectedFrom=fulltext"

  ["PubMed_home"]="https://pubmed.ncbi.nlm.nih.gov"
  ["PubMed_search"]="https://pubmed.ncbi.nlm.nih.gov/?term=black+holes"
  ["PubMed_article"]="https://pubmed.ncbi.nlm.nih.gov/36949335/"
)

# Create URLs file for batch processing
URLS_FILE="${RESULT_DIR}/urls.txt"
> "${URLS_FILE}"

echo -e "${YELLOW}Preparing URLs for testing...${NC}"
for key in "${!competitors[@]}"; do
  echo "${competitors[$key]}" >> "${URLS_FILE}"
  echo "  - ${key}: ${competitors[$key]}"
done
echo ""

# Create budget.json for performance budgets
cat > "${RESULT_DIR}/budget.json" <<EOF
{
  "budget": {
    "timings": {
      "firstPaint": 1000,
      "fullyLoaded": 3000,
      "pageLoadTime": 2000,
      "FirstContentfulPaint": 1000,
      "LargestContentfulPaint": 2500,
      "TotalBlockingTime": 200,
      "CumulativeLayoutShift": 0.1,
      "SpeedIndex": 2000
    },
    "requests": {
      "total": 100
    },
    "transferSize": {
      "total": 1000000
    },
    "lighthouse": {
      "performance": 80,
      "accessibility": 90,
      "best-practices": 90,
      "seo": 90
    }
  }
}
EOF

# Create Lighthouse config for comprehensive testing
cat > "${RESULT_DIR}/lighthouse-config.json" <<EOF
{
  "extends": "lighthouse:default",
  "settings": {
    "onlyCategories": [
      "performance",
      "accessibility",
      "best-practices",
      "seo",
      "pwa"
    ],
    "throttling": {
      "rttMs": 40,
      "throughputKbps": 10240,
      "cpuSlowdownMultiplier": 1
    },
    "screenEmulation": {
      "mobile": false,
      "width": 1350,
      "height": 940,
      "deviceScaleFactor": 1,
      "disabled": false
    }
  }
}
EOF

echo -e "${GREEN}Starting comprehensive analysis with Lighthouse...${NC}"
echo -e "${YELLOW}This will take significant time (${ITERATIONS} iterations per URL + Lighthouse analysis)...${NC}"
echo ""

# Pull the latest Docker image
echo -e "${BLUE}Pulling latest sitespeed.io Docker image with Lighthouse...${NC}"
docker pull ${DOCKER_IMAGE}

# Run sitespeed.io with Lighthouse
echo -e "${BLUE}Running sitespeed.io + Lighthouse tests...${NC}"
docker run --rm --shm-size=2g \
  -v "${PWD}/${OUTPUT_DIR}:/sitespeed.io" \
  -v "${RESULT_DIR}/budget.json:/sitespeed.io/budget.json" \
  -v "${RESULT_DIR}/lighthouse-config.json:/sitespeed.io/lighthouse-config.json" \
  ${DOCKER_IMAGE} \
  --plugins.add analysisstorer \
  --lighthouse.enable \
  --lighthouse.config /sitespeed.io/lighthouse-config.json \
  --gpsi.key "${GPSI_KEY:-}" \
  -n ${ITERATIONS} \
  --browsertime.chrome.args no-sandbox \
  --browsertime.chrome.args disable-dev-shm-usage \
  --budget.configPath /sitespeed.io/budget.json \
  --html.showAllWaterfallSummary \
  --html.pageSummaryMetrics transferSize \
  --html.pageSummaryMetrics contentSize \
  --html.pageSummaryMetrics requests \
  --html.pageSummaryMetrics fullyLoaded \
  --html.pageSummaryMetrics backEndTime \
  --html.pageSummaryMetrics frontEndTime \
  --html.pageSummaryMetrics speedIndex \
  --html.pageSummaryMetrics firstPaint \
  --html.pageSummaryMetrics firstVisualChange \
  --html.pageSummaryMetrics visualComplete85 \
  --html.pageSummaryMetrics lastVisualChange \
  --html.pageSummaryMetrics lighthouse.performance \
  --html.pageSummaryMetrics lighthouse.accessibility \
  --html.pageSummaryMetrics lighthouse.best-practices \
  --html.pageSummaryMetrics lighthouse.seo \
  --html.pageSummaryMetrics lighthouse.pwa \
  --browsertime.screenshot \
  --browsertime.screenshotParams.type png \
  --screenshot \
  --screenshotLCP \
  --video \
  --visualMetrics \
  --connectivity.profile cable \
  --outputFolder /sitespeed.io/${TIMESTAMP} \
  --summary \
  --summary-detail \
  -vv \
  < "${URLS_FILE}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Analysis Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Results saved to: ${RESULT_DIR}/${TIMESTAMP}${NC}"
echo ""
echo -e "${BLUE}Available Reports:${NC}"
echo "  📊 Main Dashboard: ${RESULT_DIR}/${TIMESTAMP}/index.html"
echo "  📈 Pages Comparison: ${RESULT_DIR}/${TIMESTAMP}/pages/index.html"
echo "  🔍 Lighthouse Reports: ${RESULT_DIR}/${TIMESTAMP}/lighthouse/*"
echo "  📁 Raw Data (JSON): ${RESULT_DIR}/${TIMESTAMP}/data/"
echo ""
echo -e "${BLUE}Key Metrics Collected:${NC}"
echo "  ✅ Core Web Vitals (LCP, FID, CLS)"
echo "  ✅ Lighthouse Scores (Performance, Accessibility, SEO, PWA)"
echo "  ✅ Speed Index & Visual Metrics"
echo "  ✅ Network Timing & Waterfall Charts"
echo "  ✅ JavaScript Execution & Main Thread Work"
echo "  ✅ Resource Sizes & Request Counts"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Open the main dashboard to see aggregate results"
echo "  2. Review pages comparison for side-by-side competitor analysis"
echo "  3. Dive into individual Lighthouse reports for detailed insights"
echo "  4. Use the JSON data in ./analyze-results.js for custom comparisons"
echo ""
echo -e "${BLUE}To run custom analysis:${NC}"
echo "  node analyze-results.js ${RESULT_DIR}/${TIMESTAMP}"
echo ""
