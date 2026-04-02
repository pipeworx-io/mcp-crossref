# mcp-crossref

MCP server for searching academic papers, journals, and citations via the [Crossref API](https://api.crossref.org). No authentication required.

## Tools

| Tool | Description |
|------|-------------|
| `search_works` | Search academic works (papers, books, datasets) by keyword |
| `get_work` | Get full metadata for a specific work by DOI |
| `get_journal` | Get the 5 most recent works published in a journal by ISSN |

## Quickstart via Pipeworx Gateway

Call any tool through the hosted gateway with zero setup:

```bash
curl -X POST https://gateway.pipeworx.io/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "crossref_search_works",
      "arguments": { "query": "machine learning climate change" }
    }
  }'
```

## License

MIT
