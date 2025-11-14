/**
 * Configuration for competitor sites to benchmark with Lighthouse
 */

export interface CompetitorSite {
  name: string;
  url: string;
  search_url: string;
  article_url: string;
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
    search_url: 'https://inspirehep.net/literature?q=black+holes',
    article_url: 'https://inspirehep.net/literature/2178285',
  },
  {
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    search_url: 'https://www.semanticscholar.org/search?q=black+holes&sort=relevance',
    article_url: 'https://www.semanticscholar.org/paper/a2cdc78e0b0c4e80e08a7a1e6e2e0e0e0e0e0e0',
  },
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com',
    search_url: 'https://scholar.google.com/scholar?q=black+holes&hl=en&as_sdt=0,5',
    article_url: 'https://scholar.google.com/scholar?cluster=1234567890&hl=en&as_sdt=0,5',
  },
  {
    name: 'Scopus',
    url: 'https://www.scopus.com',
    search_url:
      'https://www.scopus.com/results/results.uri?sort=plf-f&src=s&st1=black+holes&nlo=&nlr=&nls=',
    article_url: 'https://www.scopus.com/record/display.uri?eid=2-s2.0-12345678901234',
    note: 'Scopus requires institutional subscription for full access',
  },
  {
    name: 'Web of Science',
    url: 'https://www.webofscience.com',
    search_url: 'https://www.webofscience.com/wos/woscc/search?q=black+holes&woscc=true',
    article_url: 'https://www.webofscience.com/wos/alldb/full-record/WOS:000123456789',
    note: 'Web of Science requires institutional subscription',
  },
  {
    name: 'SciX (NASA SciX Explorer)',
    url: 'https://scix.org',
    search_url: 'https://scix.org/search?q=black+holes&sort=date',
    article_url: 'https://scix.org/record/arxiv:2301.12345',
    note: 'SciX is the modernized successor to ADS',
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
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    // Throttling settings (can be adjusted)
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  },

  // Playwright-lighthouse specific options
  playwrightOptions: {
    port: 9222,
  },

  // Timeout for each lighthouse run (ms)
  timeout: 60000,
};
