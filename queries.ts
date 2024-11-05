export const queries = [
  {
    description: 'first author search',
    name: 'first-author',
    query: 'author:"^Solanki, Sami"',
  },
  {
    description: 'citations search',
    name: 'citations',
    query: 'citations(abs:"JWST")',
  },
  {
    description: 'year range search',
    name: 'year-range',
    query: 'year:2010-2020',
  },
  {
    description: 'title keyword search',
    name: 'title-keyword',
    query: 'title:"black hole"',
  },
  {
    description: 'full text search',
    name: 'full-text',
    query: 'full:"gravitational waves"',
  },
  {
    description: 'affiliation search',
    name: 'affiliation',
    query: 'aff:"Harvard"',
  },
  {
    description: 'abstract keyword search',
    name: 'abstract-keyword',
    query: 'abstract:"supernova"',
  },
  {
    description: 'bibliographic code search',
    name: 'bibcode-search',
    query: 'bibcode:2020ApJ...890L..10M',
  },
  {
    description: 'publication type search',
    name: 'pub-type',
    query: 'property:refereed',
  },
  {
    description: 'keyword search',
    name: 'keyword-search',
    query: 'keyword:"exoplanet"',
  },
  {
    description: 'arxiv identifier search',
    name: 'arxiv-id',
    query: 'arxiv:2005.14165',
  },
  {
    description: 'OR condition search',
    name: 'or-search',
    query: 'author:"Einstein, A" OR author:"Newton, I"',
  },
  {
    description: 'AND condition search',
    name: 'and-search',
    query: 'author:"Einstein, A" AND year:1916',
  },
  {
    description: 'NOT condition search',
    name: 'not-search',
    query: 'title:"quantum" NOT title:"gravity"',
  },
  {
    description: 'journal search',
    name: 'journal-search',
    query: 'journal:"Nature"',
  },
  {
    description: 'publication date exact',
    name: 'pub-date',
    query: 'pubdate:"2023-10-01"',
  },
  {
    description: 'multiple fields search',
    name: 'multi-field',
    query: 'author:"Feynman" title:"path integral"',
  },
  {
    description: 'first author with citations search',
    name: 'first-author-citations',
    query: 'author:"^Solanki, Sami" citations(abstract:JWST)',
  },
  {
    description: 'papers cited by specific author',
    name: 'cited-by-author',
    query: 'citations(author:"Einstein, A")',
  },
  {
    description: 'title keyword with citations',
    name: 'title-citations',
    query: 'title:"black hole" citations(author:"Hawking, S")',
  },
  {
    description: 'year range with citations from a specific journal',
    name: 'year-range-journal-citations',
    query: 'year:2010-2020 citations(journal:"Astrophysical Journal")',
  },
  {
    description: 'full text search with references',
    name: 'full-text-references',
    query: 'full:"gravitational waves" references(author:"Thorne, K")',
  },
  {
    description: 'affiliation with references search',
    name: 'affiliation-references',
    query: 'aff:"Harvard" references(title:"cosmology")',
  },
  {
    description: 'publication type with citations in specific year',
    name: 'pub-type-citations-year',
    query: 'property:refereed citations(year:2019)',
  },
  {
    description: 'keyword search with cited references',
    name: 'keyword-cited-references',
    query: 'keyword:"dark matter" references(author:"Zwicky, F")',
  },
  {
    description: 'arxiv ID with citations search',
    name: 'arxiv-citations',
    query: 'arxiv:2005.14165 citations(year:2021)',
  },
  {
    description: 'multiple field search with nested citations',
    name: 'multi-field-nested-citations',
    query:
      'author:"Feynman" title:"quantum" citations(journal:"Physical Review")',
  },
  {
    description: 'author with citations in title and abstract',
    name: 'author-citations-title-abstract',
    query: 'author:"Sagan" citations(title:"life" abstract:"extraterrestrial")',
  },
  {
    description: 'author OR title with citations in journal',
    name: 'author-or-title-citations-journal',
    query:
      '(author:"Einstein, A" OR title:"relativity") citations(journal:"Nature")',
  },
];
