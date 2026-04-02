/**
 * Crossref MCP — wraps the Crossref REST API (academic papers, free, no auth)
 *
 * Tools:
 * - search_works: search academic works by keyword
 * - get_work: get full metadata for a work by DOI
 * - get_journal: get recent works published in a journal by ISSN
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const BASE = 'https://api.crossref.org';
const HEADERS = {
  'User-Agent': 'pipeworx-mcp/1.0 (mailto:hello@pipeworx.io)',
};

// ── API Response Types ────────────────────────────────────────────────

type CrossrefAuthor = {
  given?: string;
  family?: string;
  name?: string;
  ORCID?: string;
};

type CrossrefDate = {
  'date-parts': number[][];
  'date-time'?: string;
  timestamp?: number;
};

type CrossrefWork = {
  DOI: string;
  title?: string[];
  'container-title'?: string[];
  author?: CrossrefAuthor[];
  published?: CrossrefDate;
  'published-print'?: CrossrefDate;
  'published-online'?: CrossrefDate;
  abstract?: string;
  type?: string;
  publisher?: string;
  URL?: string;
  'is-referenced-by-count'?: number;
  score?: number;
  subject?: string[];
  ISSN?: string[];
  volume?: string;
  issue?: string;
  page?: string;
};

type CrossrefMessage<T> = {
  status: string;
  'message-type': string;
  message: T;
};

type CrossrefWorksMessage = {
  'total-results': number;
  items: CrossrefWork[];
  query?: { 'search-terms': string; 'start-index': number };
};

type CrossrefSingleWorkMessage = CrossrefWork;

type CrossrefJournalWorksMessage = {
  'total-results': number;
  items: CrossrefWork[];
};

// ── Helpers ───────────────────────────────────────────────────────────

function formatAuthor(a: CrossrefAuthor): string {
  if (a.family && a.given) return `${a.given} ${a.family}`;
  if (a.family) return a.family;
  return a.name ?? 'Unknown';
}

function formatDate(d?: CrossrefDate): string | null {
  if (!d) return null;
  const parts = d['date-parts']?.[0];
  if (!parts) return null;
  return parts.filter(Boolean).join('-');
}

function mapWork(w: CrossrefWork) {
  return {
    doi: w.DOI,
    title: w.title?.[0] ?? null,
    journal: w['container-title']?.[0] ?? null,
    authors: (w.author ?? []).map(formatAuthor),
    published: formatDate(w.published ?? w['published-print'] ?? w['published-online']),
    type: w.type ?? null,
    publisher: w.publisher ?? null,
    abstract: w.abstract ?? null,
    citations: w['is-referenced-by-count'] ?? null,
    subjects: w.subject ?? [],
    url: w.URL ?? `https://doi.org/${w.DOI}`,
  };
}

// ── Tool Definitions ──────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'search_works',
    description:
      'Search academic works (papers, books, datasets) in the Crossref index by keyword. Returns title, authors, journal, DOI, and citation count.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "climate change machine learning")' },
        limit: {
          type: 'number',
          description: 'Number of results to return (1-100, default 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_work',
    description:
      'Get full metadata for a specific academic work by its DOI. Returns title, authors, abstract, journal, publisher, citation count, and subjects.',
    inputSchema: {
      type: 'object',
      properties: {
        doi: { type: 'string', description: 'DOI of the work (e.g., "10.1038/nature12373")' },
      },
      required: ['doi'],
    },
  },
  {
    name: 'get_journal',
    description:
      'Get the 5 most recent works published in a journal by its ISSN. Returns title, authors, DOI, and publication date.',
    inputSchema: {
      type: 'object',
      properties: {
        issn: { type: 'string', description: 'Journal ISSN (e.g., "1476-4687" for Nature)' },
      },
      required: ['issn'],
    },
  },
];

// ── Tool Implementations ──────────────────────────────────────────────

async function searchWorks(query: string, limit: number) {
  const rows = Math.min(100, Math.max(1, limit));
  const params = new URLSearchParams({ query, rows: String(rows) });

  const res = await fetch(`${BASE}/works?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Crossref search error: ${res.status}`);

  const data = (await res.json()) as CrossrefMessage<CrossrefWorksMessage>;

  return {
    total_results: data.message['total-results'],
    results: data.message.items.map(mapWork),
  };
}

async function getWork(doi: string) {
  const encoded = encodeURIComponent(doi);
  const res = await fetch(`${BASE}/works/${encoded}`, { headers: HEADERS });
  if (res.status === 404) throw new Error(`Work not found for DOI: ${doi}`);
  if (!res.ok) throw new Error(`Crossref work error: ${res.status}`);

  const data = (await res.json()) as CrossrefMessage<CrossrefSingleWorkMessage>;

  return mapWork(data.message);
}

async function getJournal(issn: string) {
  const params = new URLSearchParams({ rows: '5' });
  const res = await fetch(`${BASE}/journals/${issn}/works?${params}`, { headers: HEADERS });
  if (res.status === 404) throw new Error(`Journal not found for ISSN: ${issn}`);
  if (!res.ok) throw new Error(`Crossref journal error: ${res.status}`);

  const data = (await res.json()) as CrossrefMessage<CrossrefJournalWorksMessage>;

  return {
    issn,
    total_results: data.message['total-results'],
    recent_works: data.message.items.map(mapWork),
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_works':
      return searchWorks(args.query as string, (args.limit as number) ?? 10);
    case 'get_work':
      return getWork(args.doi as string);
    case 'get_journal':
      return getJournal(args.issn as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool } satisfies McpToolExport;
