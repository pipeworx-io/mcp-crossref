# Crossref — DOI Metadata

Crossref is the largest DOI (Digital Object Identifier) registration agency. Every DOI you've seen in an academic citation goes through them. Their API exposes structured metadata for ~150M+ scholarly works: titles, authors, ORCIDs, abstracts where available, references, citation graphs. Free, no auth required.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1863+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/crossref/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1863+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/crossref_search_works \
  -H 'Content-Type: application/json' \
  -d '{"query":"climate change machine learning"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/crossref_search_works`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-crossref` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/crossref/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "crossref": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-crossref"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Crossref data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
