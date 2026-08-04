# Crossref — DOI Metadata

Crossref is the largest DOI (Digital Object Identifier) registration agency. Every DOI you've seen in an academic citation goes through them. Their API exposes structured metadata for ~150M+ scholarly works: titles, authors, ORCIDs, abstracts where available, references, citation graphs. Free, no auth required.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Why this matters for AI agents

Where [Semantic Scholar](/docs/reference/semantic-scholar) is search-focused, Crossref is the authoritative source for *DOI metadata*. If you have a DOI and need its canonical metadata, Crossref is the answer. Citation networks are also more complete here than in many discipline-specific databases.

Common flows:

- **DOI → metadata.** `crossref_get_work({doi: "10.48550/arXiv.1706.03762"})` → title, authors, journal, year, citations.
- **Author DOIs.** Find a researcher's published works by ORCID or name.
- **Citation graph.** A paper's references and which papers cite it (where reported).

For free-text academic search, prefer [Semantic Scholar](/docs/reference/semantic-scholar) — Crossref's search is more limited.

Citable URI: `pipeworx://crossref/work/{doi}`.

## Auth

Public, free. Crossref has a "polite pool" giving priority to clients that identify themselves via User-Agent. Pipeworx forwards `pipeworx-mcp/1.0 (https://pipeworx.io)` so we get polite-pool treatment by default.

## What's in a Crossref record

| Field | Notes |
|---|---|
| Title | Authoritative |
| Authors with ORCID | When the publisher recorded ORCIDs |
| Journal / publisher / year | Stable identifiers |
| References (the cited works) | Coverage varies by publisher |
| References by (citers) | Available via separate "is-referenced-by-count" |
| Open-access link | When publisher provides it |
| Funder data | NSF, NIH, etc. when reported |

## Common pitfalls

- **Reference-list completeness.** Some publishers send their full reference list to Crossref; others don't. A paper with 0 references in Crossref may have 50 in print. For exhaustive citation graphs, cross-reference with Semantic Scholar.
- **Errata and retractions.** Crossref tracks "scholix" links between original and retraction notices. Always check the `relation` field for `is-retracted-by` before citing.
- **Author ORCID coverage.** ORCID adoption has grown but isn't universal. Older papers and small-publisher works often lack ORCIDs. Don't rely on ORCID-based deduplication for full coverage.
- **DOI normalization.** Different sources format DOIs slightly differently: `10.1234/xyz`, `https://doi.org/10.1234/xyz`, `doi:10.1234/xyz`. Crossref accepts the bare form. Strip prefixes before passing to the API.
- **Books and chapters.** Crossref covers books and chapters as well as articles. The `type` field tells you which (`journal-article`, `book-chapter`, `proceedings-article`, etc.). For systematic literature reviews, type filtering matters.
- **Pre-prints.** Some pre-print servers register DOIs through Crossref (arXiv, bioRxiv). The same content may have multiple DOIs (pre-print + accepted version). Track via `relation` field.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "crossref": {
      "url": "https://gateway.pipeworx.io/crossref/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Crossref data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
