#!/bin/bash

# Competitor Performance Analysis using sitespeed.io
# This script runs comprehensive performance tests on competitor sites
# and generates comparative reports

set -e

# Configuration
ITERATIONS=3  # Number of test runs per URL (3-5 for quick tests, 7-11 for statistical accuracy)
OUTPUT_DIR="./sitespeed-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULT_DIR="${OUTPUT_DIR}/${TIMESTAMP}"

# Docker image - using the +1 variant which includes Lighthouse and PageSpeed Insights
DOCKER_IMAGE="sitespeedio/sitespeed.io:latest"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Competitor Performance Analysis${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "  - Iterations per URL: ${ITERATIONS}"
echo "  - Output directory: ${RESULT_DIR}"
echo "  - Docker image: ${DOCKER_IMAGE}"
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

# Prepare URLs array for testing
URLS=()

echo -e "${YELLOW}Preparing URLs for testing...${NC}"
for key in "${!competitors[@]}"; do
  URLS+=("${competitors[$key]}")
  echo "  - ${key}: ${competitors[$key]}"
done
echo ""

# Also create a URLs file for reference
URLS_FILE="${RESULT_DIR}/urls.txt"
printf '%s\n' "${URLS[@]}" > "${URLS_FILE}"

# Common sitespeed.io options
SITESPEED_OPTS=(
  # Number of runs per URL
  "-n" "${ITERATIONS}"

  # Enable plugins
  "--plugins.add" "analysisstorer"

  # Browser configuration
  "--browsertime.chrome.args" "no-sandbox"
  "--browsertime.chrome.args" "disable-dev-shm-usage"

  # Performance budget and metrics
  "--budget.configPath" "/sitespeed.io/budget.json"

  # HTML output configuration - show comprehensive metrics
  "--html.showAllWaterfallSummary"
  "--html.pageSummaryMetrics" "timings.fullyLoaded"
  "--html.pageSummaryMetrics" "timings.SpeedIndex"
  "--html.pageSummaryMetrics" "timings.largestContentfulPaint"
  "--html.pageSummaryMetrics" "transferSize.total"
  "--html.pageSummaryMetrics" "requests.total"
  "--html.pageSummaryMetrics" "score.performance"

  # Screenshot and video
  "--browsertime.screenshot" "true"
  "--browsertime.screenshotParams.type" "png"
  "--screenshot"
  "--screenshotLCP"
  "--video"
  "--visualMetrics"

  # Connectivity preset (cable is default, can change to 3g, 3gfast, 3gslow, 2g, etc.)
  "--connectivity.profile" "cable"

  # Output formats
  "--outputFolder" "/sitespeed.io/${TIMESTAMP}"

  # Graphite/Grafana integration (optional - uncomment if you have Graphite)
  # "--graphite.host" "your-graphite-host"
  # "--graphite.port" "2003"

  # Slack notification (optional - uncomment if you want Slack notifications)
  # "--slack.hookUrl" "your-slack-webhook-url"

  # CPU throttling (optional - uncomment to simulate slower devices)
  # "--browsertime.chrome.CPUThrottlingRate" "4"

  # Mobile emulation (optional - uncomment to test mobile)
  # "--mobile" "true"

  # Summary
  "--summary"
  "--summary-detail"

  # Verbose output
  "-vv"
)

# Create budget.json for performance budgets (optional - won't fail tests)
cat > "${RESULT_DIR}/budget.json" <<EOF
{
  "budget": {
    "timings": {
      "fullyLoaded": 5000,
      "largestContentfulPaint": 4000,
      "speedIndex": 3000
    },
    "requests": {
      "total": 150
    },
    "transferSize": {
      "total": 2000000
    }
  }
}
EOF

echo -e "${GREEN}Starting sitespeed.io analysis...${NC}"
echo -e "${YELLOW}This will take some time (${ITERATIONS} iterations per URL)...${NC}"
echo ""

# Pull the latest Docker image
echo -e "${BLUE}Pulling latest sitespeed.io Docker image...${NC}"
docker pull ${DOCKER_IMAGE}

# Run sitespeed.io
echo -e "${BLUE}Running sitespeed.io tests...${NC}"
docker run --rm \
  -v "${PWD}/${OUTPUT_DIR}:/sitespeed.io" \
  -v "${RESULT_DIR}/budget.json:/sitespeed.io/budget.json" \
  ${DOCKER_IMAGE} \
  "${SITESPEED_OPTS[@]}" \
  "${URLS[@]}"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Analysis Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${GREEN}Results saved to: ${RESULT_DIR}${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Open ${RESULT_DIR}/${TIMESTAMP}/index.html in your browser"
echo "  2. Review the pages comparison page for side-by-side metrics"
echo "  3. Check individual site reports for detailed analysis"
echo "  4. Review waterfall charts and filmstrip views"
echo ""
echo -e "${YELLOW}Pro tips:${NC}"
echo "  - The 'pages' page shows all tested URLs with comparison metrics"
echo "  - Click on any URL to see detailed metrics, waterfalls, and screenshots"
echo "  - The summary boxes at the top show aggregate statistics"
echo "  - JSON data is available in ${RESULT_DIR}/${TIMESTAMP}/data/ for custom analysis"
echo ""
