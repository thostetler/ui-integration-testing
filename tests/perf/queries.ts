export const queries = [
  {
    description: 'first author search',
    name: 'first-author',
    query: 'author:"^Solanki, Sami"',
    refinement: 'year:2003-2004',
  },

  {
    description: 'year range search',
    name: 'year-range',
    query: 'year:2010-2020',
    refinement: 'bibstem:ApJ',
  },

  {
    description: 'title keyword search',
    name: 'title-keyword',
    query: 'title:"black hole"',
    refinement: 'author:"Hawking, S"',
  },
  {
    description: 'abstract keyword search',
    name: 'abstract-keyword',
    query: 'abs:"supernova"',
    refinement: 'year:2018-2023',
  },
  {
    description: 'bibliographic code search',
    name: 'bibcode-search',
    query: 'bibcode:2020ApJ...890...86S',
    refinement: 'property:refereed',
  },
  {
    description: 'citations search',
    name: 'citations',
    query: 'citations(abs:"JWST")',
    refinement: 'property:refereed',
  },
  {
    description: 'AND condition search',
    name: 'and-search',
    query: 'author:"Einstein, A" AND year:1916',
    refinement: 'property:refereed',
  },
  {
    description: 'full text search',
    name: 'full-text',
    query: 'full:"gravitational waves"',
    refinement: 'year:2015-2023',
  },
];
