/**
 * Configuration for competitor sites to benchmark with Lighthouse
 */

export interface CompetitorSite {
  name: string;
  url: string;
  search_url: string;
  article_url: string | null;
  note?: string;
}

export const competitors: CompetitorSite[] = [
  {
    name: 'arXiv',
    url: 'https://arxiv.org',
    search_url:
      'https://arxiv.org/search/?query=black+holes&searchtype=all&abstracts=show&order=-announced_date_first&size=25',
    article_url: 'https://arxiv.org/abs/2301.12345',
  },
  {
    name: 'INSPIRE-HEP',
    url: 'https://inspirehep.net',
    search_url:
      'https://inspirehep.net/literature?sort=mostrecent&size=25&page=1&q=black%20holes',
    article_url: 'https://inspirehep.net/literature/3082719',
  },
  {
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    search_url: 'https://www.semanticscholar.org/search?q=black+holes&sort=relevance',
    article_url:
      'https://www.semanticscholar.org/paper/Particle-creation-by-black-holes-Hawking/6b9d83c086ea962b6e7ef5caaaf2c241a4d47ff8',
  },
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com',
    search_url: 'https://scholar.google.com/scholar?q=black+holes&hl=en&as_sdt=0,5',
    article_url: null,
    note: 'Google Scholar search results link directly to publisher full-text; no dedicated article details page',
  },
  {
    name: 'SciX (NASA SciX Explorer)',
    url: 'https://scixplorer.org',
    search_url:
      'https://scixplorer.org/search?n=10&p=1&q=black+holes&sort=score+desc&sort=date+desc',
    article_url: 'https://scixplorer.org/abs/2022ApJ...930L..12E/abstract',
    note: 'SciX is the modernized successor to ADS',
  },
  {
    name: 'GeoScience World',
    url: 'https://pubs.geoscienceworld.org',
    search_url:
      'https://pubs.geoscienceworld.org/search-results?page=1&quicknav=1&q=black%20holes',
    article_url:
      'https://pubs.geoscienceworld.org/gsa/gsabulletin/article-abstract/121/3-4/574/2374/Supply-and-dispersal-of-flood-sediment-from-a?redirectedFrom=fulltext#15102376',
  },
  {
    name: 'PubMed',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    search_url: 'https://pubmed.ncbi.nlm.nih.gov/?term=black+holes',
    article_url: 'https://pubmed.ncbi.nlm.nih.gov/36949335/',
  },
];

/**
 * Lighthouse test configuration
 */
export const lighthouseConfig = {
  // Number of runs per URL for statistical significance
  runsPerUrl: 3,

  // Lighthouse settings
  lighthouseOptions: {
    logLevel: 'error', // Reduce logging overhead
    output: 'json',
    onlyCategories: ['performance'], // Focus on performance only for speed
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false,
    },
    // No throttling for faster tests in controlled environment
    throttling: {
      rttMs: 0,
      throughputKbps: 0,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    // Skip some audits for speed
    skipAudits: [
      'screenshot-thumbnails',
      'final-screenshot',
      'full-page-screenshot',
    ],
  },

  // Playwright-lighthouse specific options
  playwrightOptions: {
    port: 9222,
  },

  // Timeout for each lighthouse run (ms)
  timeout: 60000,
};
