import { z } from 'zod';

export const userDataSchema = z.object({
  minAuthorsPerResult: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric string')
    .default('4')
    .describe('Minimum number of authors to display per search result.'),

  externalLinkAction: z
    .enum(['Auto', 'Open new tab', 'Open in current tab'])
    .default('Auto')
    .describe('Determines how external links are handled.'),

  defaultDatabase: z
    .array(
      z.object({
        name: z.string().describe('Name of the database category.'),
        value: z.boolean().describe('Whether the database category is selected by default.'),
      }),
    )
    .describe('List of default database selections.'),

  defaultHideSidebars: z
    .enum(['Show', 'Hide'])
    .default('Show')
    .describe('Controls the visibility of sidebars in the UI.'),

  homePage: z
    .enum(['Modern Form', 'Classic Form', 'Paper Form'])
    .default('Modern Form')
    .describe('Defines the default homepage layout.'),

  customFormats: z.array(z.string()).describe('List of user-defined export formats.'),

  bibtexKeyFormat: z.string().describe('Format for generating BibTeX export keys.'),

  bibtexMaxAuthors: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric string')
    .default('10')
    .describe('Maximum number of authors to include in BibTeX exports.'),

  bibtexABSKeyFormat: z.string().describe('Format for generating BibTeX ABS export keys.'),

  bibtexAuthorCutoff: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric string')
    .default('10')
    .describe('Number of authors before using "et al." in BibTeX exports.'),

  bibtexABSMaxAuthors: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric string')
    .default('10')
    .describe('Maximum number of authors in BibTeX ABS exports.'),

  bibtexABSAuthorCutoff: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric string')
    .default('10')
    .describe('Number of authors before using "et al." in BibTeX ABS exports.'),

  bibtexJournalFormat: z
    .enum(['Use AASTeX macros', 'Use Journal Abbreviations'])
    .describe('Format for handling journal names in BibTeX exports.'),

  defaultExportFormat: z
    .enum([
      'BibTeX',
      'ADS',
      'BibTeX ABS',
      'EndNote',
      'ProCite',
      'RIS',
      'RefWorks',
      'RSS',
      'MEDLARS',
      'DC-XML',
      'JATSXML',
      'REF-XML',
      'REFABS-XML',
      'AASTeX',
      'IEEE',
      'Icarus',
      'MNRAS',
      'Solar Physics',
      'VOTable',
      'Custom Format',
    ])
    .default('BibTeX')
    .describe('Default export format for citations.'),
});

export type UserData = z.infer<typeof userDataSchema>;
