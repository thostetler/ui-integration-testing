# Competitor Analysis - Quick Start

## TL;DR

Run comprehensive performance comparison in 3 steps:

```bash
# 1. Run tests (with Lighthouse - recommended)
./run-competitor-analysis-lighthouse.sh

# 2. Analyze results (replace <timestamp> with actual directory name)
node analyze-results.js ./sitespeed-results/<timestamp>

# 3. View HTML reports
open ./sitespeed-results/<timestamp>/index.html
```

## What Gets Tested

✅ 7 competitor sites (arXiv, INSPIRE-HEP, Semantic Scholar, Google Scholar, SciX, GeoScience World, PubMed)
✅ 3 page types per site (home, search, article)
✅ 7 iterations per URL
✅ 40+ performance metrics
✅ Lighthouse scores (Performance, Accessibility, SEO, Best Practices, PWA)
✅ Core Web Vitals (LCP, FCP, TBT, CLS)

## Expected Runtime

- **Basic version**: ~20-30 minutes
- **Lighthouse version**: ~45-60 minutes

*Time varies based on network speed and site responsiveness*

## Output Files

```
sitespeed-results/<timestamp>/
├── index.html              ← Start here! Main dashboard
├── pages/                  ← Detailed page reports
│   └── <domain>/
│       ├── index.html      ← Page-specific report
│       ├── browsertime.json
│       └── data/
├── lighthouse/             ← Lighthouse JSON reports
├── data/                   ← Raw performance data
└── analysis/               ← Exported comparisons
    ├── comparison.csv      ← Spreadsheet-ready
    └── comparison.json     ← Programmatic access
```

## Key Metrics to Review

### 1. Load Performance
- **Fully Loaded**: Total page load time (target: <3s)
- **Speed Index**: Visual loading speed (target: <2s)

### 2. Core Web Vitals
- **LCP**: Largest Contentful Paint (target: <2.5s)
- **TBT**: Total Blocking Time (target: <200ms)
- **CLS**: Cumulative Layout Shift (target: <0.1)

### 3. Lighthouse Scores (0-100)
- **Performance**: Speed & optimization (target: >90)
- **Accessibility**: WCAG compliance (target: >90)

## Quick Customization

### Test fewer sites
Edit `run-competitor-analysis-lighthouse.sh` and comment out unwanted sites:

```bash
declare -A competitors=(
  # ["arXiv_home"]="https://arxiv.org"  # Commented out
  ["SciX_home"]="https://scixplorer.org"
)
```

### Fewer iterations (faster)
```bash
ITERATIONS=3  # Change from 7 to 3
```

### Mobile testing
Uncomment in script:
```bash
--mobile true
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Docker not found" | Install Docker Desktop |
| "Permission denied" | Run `chmod +x *.sh` |
| Tests timeout | Reduce iterations or test fewer URLs |
| Out of disk space | Clean old results: `rm -rf sitespeed-results/old-*` |

## Need More Help?

📖 Full documentation: `COMPETITOR_ANALYSIS.md`
🌐 sitespeed.io docs: https://www.sitespeed.io/documentation/
💡 Web Vitals guide: https://web.dev/vitals/

---

**Pro Tip**: Run monthly and track trends over time to measure improvements!
