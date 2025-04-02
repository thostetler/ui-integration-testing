export const ROUTES = {
  LOGIN: '/user/account/login',
  REGISTER: '/user/account/register',
  FORGOT_PASSWORD: '/user/account/forgotpassword',
  ROOT: '/',
  CLASSIC_FORM: '/classic-form',
  PAPER_FORM: '/paper-form',
  FEEDBACK_CORRECT_ABS: '/feedback/correctabstract',
  FEEDBACK_MISSING_REFS: '/feedback/missingreferences',
  FEEDBACK_ASSOCIATED_ARTICLES: '/feedback/associatedarticles',
  SEARCH: '/search',
  SEARCH_EXPORT_BIBTEX: '/export-bibtex',
  ABS: '/abs',
  ABS_ABSTRACT: 'abstract',
  ABS_CITATIONS: 'citations',
  ABS_REFERENCES: 'references',
  ABS_COREADS: 'coreads',
  ABS_SIMILAR: 'similar',
  ABS_VOLUME: 'toc',
  ABS_GRAPHICS: 'graphics',
  ABS_METRICS: 'metrics',
  ABS_EXPORT: 'exportcitation',
} as const;

export const MAX_A11Y_VIOLATIONS = 10;
export const A11Y_TAGS = ['wcag2a', 'wcag2aa'];
export const API_TIMEOUT = 30_000;
