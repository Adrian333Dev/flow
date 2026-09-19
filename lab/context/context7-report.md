Below is the unified report, verified against the current Context7 docs and the public `upstash/context7` source as of **September 18, 2026**. I’ve explicitly separated what Context7 documents from what cannot be known because its backend/search implementation is private.

# Context7 MCP: Architecture, Inputs, Outputs, and Retrieval Pipeline

**Verified:** September 18, 2026
**Primary sources:** Context7 documentation, Context7 Public API specification, and the public `upstash/context7` MCP repository.

## 1. Executive Summary

Context7 is **not a simple keyword/document search system**.

Its current architecture is best described as a **hybrid retrieval system**:

```text
AI coding agent
    │
    │ formulates a focused documentation query
    ▼
Context7 MCP
    │
    ├── resolve-library-id
    │       │
    │       └── library identification/ranking
    │
    └── query-docs
            │
            └── documentation retrieval/ranking
                    │
                    ├── vector search
                    └── LLM reranking
                            │
                            ▼
                    relevant docs/snippets
                            │
                            ▼
                      returned to agent
```

The important distinction is that the **public MCP server itself is relatively thin**. It exposes the tools, validates their arguments, sends the request to Context7's API, and returns the API response. The actual parsing, indexing, vector retrieval, and reranking backend is not open source. Context7 explicitly states that the API backend, parsing engine, and crawling engine are private. ([GitHub][1])

However, Context7's public API documentation does reveal several important details about the retrieval architecture:

* vector search exists as a retrieval stage;
* LLM reranking exists on top of that retrieval stage;
* `fast=true` explicitly bypasses LLM reranking and returns vector-search results directly;
* documentation is indexed into retrievable pieces/snippets;
* those pieces can contain both prose/documentation and code examples;
* the final results are relevance-ranked and deduplicated. ([Context7][2])

So the correct mental model is:

> **semantic/vector retrieval first, intelligent LLM-based relevance selection afterward.**

It is considerably more sophisticated than `grep`, exact keyword search, or a simple database text query.

---

# 2. The MCP Layer

The current public MCP implementation exposes two primary tools:

```text
resolve-library-id
query-docs
```

The current MCP package in the repository is version **4.1.1**. The major "intelligent query-based architecture" was introduced in the earlier 2.0.0 architecture revision. ([GitHub][3])

The MCP server source shows that these tools ultimately call:

```text
/v2/libs/search
/v2/context
```

respectively. The MCP server itself does not perform the document search locally. It forwards the query to the Context7 API. ([GitHub][4])

---

# 3. Tool 1: `resolve-library-id`

## Input

The MCP tool requires:

```json
{
  "libraryName": "Next.js",
  "query": "How do I implement authentication middleware?"
}
```

There are exactly two meaningful inputs:

```text
libraryName
query
```

The source describes `query` as the question/task being looked up and explicitly says that it is sent to the Context7 API for processing and relevance ranking. ([GitHub][4])

The Context7 API receives these values as:

```http
GET /api/v2/libs/search
    ?libraryName=Next.js
    &query=How%20do%20I%20implement%20authentication%20middleware?
```

The public MCP implementation constructs that request directly. ([GitHub][4])

## What happens internally?

Context7 searches its library index for candidates matching the supplied library name and then uses the query to determine which candidate is most relevant.

The documented ranking factors include:

```text
name similarity
description relevance
documentation/snippet coverage
source reputation
benchmark score
relevance to the requested task
```

The MCP instructions explicitly tell the agent to consider these factors when selecting a library. ([GitHub][4])

The public API describes `/v2/libs/search` as providing **intelligent LLM-powered ranking based on query context**. It also documents a `fast=true` mode that skips LLM reranking and returns the top vector-search results directly. ([Context7][2])

Therefore:

```text
libraryName
    ↓
candidate library retrieval
    ↓
vector/relevance retrieval
    ↓
LLM-based ranking
    ↓
ranked library candidates
```

The exact mathematical scoring formula is **not publicly documented**.

---

# 4. Output of `resolve-library-id`

The public API returns library objects containing fields such as:

```json
{
  "id": "/vercel/next.js",
  "title": "Next.js",
  "description": "The React Framework",
  "branch": "canary",
  "lastUpdateDate": "...",
  "state": "finalized",
  "totalTokens": 607822,
  "totalSnippets": 3629,
  "stars": 131745,
  "trustScore": 10,
  "benchmarkScore": 95.5,
  "versions": [
    "v15.1.8",
    "v14.3.0"
  ]
}
```

These fields are documented by the public API schema. ([Context7][2])

The MCP layer then formats the search response into text such as:

```text
Available Libraries:

...
```

The source confirms that it receives the API's `SearchResponse`, formats it, and returns it as MCP text content. ([GitHub][4])

---

# 5. Tool 2: `query-docs`

Once a library has been selected, the agent calls:

```json
{
  "libraryId": "/vercel/next.js",
  "query": "How do I implement authentication middleware?"
}
```

The two meaningful inputs are:

```text
libraryId
query
```

The MCP source explicitly describes `query` as a natural-language request for a **single concept** and recommends making it specific rather than using vague queries such as:

```text
"auth"
"hooks"
```

Instead, it recommends queries such as:

```text
"How to set up authentication with JWT in Express.js"
"React useEffect cleanup function examples"
```

This is important because **the query itself is a major part of retrieval quality**. ([GitHub][4])

---

# 6. What `query-docs` Sends to the Backend

The current MCP implementation is extremely direct:

```text
query
libraryId
      ↓
https://mcp/.../api/v2/context
```

The source constructs:

```http
GET /api/v2/context
    ?query=...
    &libraryId=...
```

and returns the response body to the MCP client. ([GitHub][4])

This means the MCP server is primarily a **protocol adapter**.

It is not itself:

```text
embedding documents
chunking documents
searching a vector database
running a reranker
```

Those operations happen in the Context7 backend.

---

# 7. The Core Retrieval Pipeline

The most important architectural fact comes from the public API's `fast` parameter.

For `/v2/context`, Context7 documents:

```text
fast=false
    → normal intelligent retrieval
    → LLM reranking

fast=true
    → skip LLM reranking
    → return top vector-search results directly
```

The same pattern exists for library search. ([context7.com][2])

That establishes this pipeline:

```text
                 Query
                   │
                   ▼
          vector / semantic retrieval
                   │
                   ▼
          candidate documentation
                   │
                   ▼
             LLM reranking
                   │
                   ▼
       final relevant documentation
```

In other words, Context7 is not simply asking an LLM:

> "Which documentation page should I use?"

It first has a retrieval system that narrows the enormous documentation corpus down to a candidate set.

The LLM then operates on that candidate set to improve relevance.

That is the standard general shape of a modern RAG retrieval pipeline.

---

# 8. Vector Search

Context7 explicitly describes `fast=true` as returning the **top vector-search results directly**.

Therefore, we can say with confidence that the indexed documentation has a vector/semantic representation and that queries are used to retrieve semantically similar material.

For example, a query like:

```text
How can I invalidate a cached server-side request after a mutation?
```

does not need to literally contain the exact wording used in the documentation.

Semantic retrieval can potentially connect concepts such as:

```text
cache invalidation
revalidation
mutation
invalidate cache
refresh cached data
```

even where the terminology differs.

The existence of vector search is documented.

However, the following details are **not publicly disclosed for the hosted Context7 service**:

```text
embedding model
embedding dimensionality
vector database implementation
HNSW vs IVF vs another ANN algorithm
similarity metric
candidate count
exact retrieval scoring formula
metadata filtering formula
whether lexical/BM25 retrieval is also combined with vectors
```

Those details should therefore **not** be assumed.

---

# 9. LLM Reranking

After retrieval, Context7 performs LLM-based reranking.

Context7's privacy documentation explicitly says:

> MCP-formulated queries are passed to LLMs to rerank and select the most relevant documentation.

It states that Context7 uses trusted providers including:

```text
OpenAI
Google Gemini
Anthropic
```

for this purpose. ([Context7][5])

Therefore the normal pipeline is approximately:

```text
query
  ↓
vector retrieval
  ↓
candidate snippets
  ↓
LLM evaluates relevance
  ↓
reordered / selected snippets
```

The exact reranker prompt, model selection logic, candidate count, scoring mechanism, and score-combination formula are not publicly exposed.

So it would be incorrect to claim something like:

> "Context7 uses GPT-X with a 32-item candidate list and cosine similarity threshold Y."

There is not enough public evidence for that.

---

# 10. Does Context7 Itself Understand the User's Whole Prompt?

No.

This is an important distinction.

Context7's privacy documentation explicitly says that:

```text
full prompts
code
conversation context
```

remain with the AI assistant and are not sent to Context7.

Instead, the **MCP client/agent formulates the query** that is sent to Context7.

So the flow is:

```text
User prompt
     │
     ▼
Claude / Cursor / another coding agent
     │
     │ creates focused query
     ▼
Context7
```

For example, the user may say:

```text
I'm building a Next.js app with Supabase auth.
I have middleware that works locally but fails after deployment.
...
```

The agent might reduce that to something like:

```text
Next.js middleware authentication in production
```

or:

```text
How does Next.js middleware access authentication cookies
```

Context7 receives the **formulated search query**, not the complete conversation.

Context7 explicitly warns MCP clients not to place secrets, proprietary code, API keys, passwords, or confidential information in that query. ([Context7][5])

---

# 11. Documentation Indexing

Context7 does not simply index arbitrary repository text indiscriminately.

For repositories, it primarily parses documentation-oriented files:

```text
.md
.mdx
.markdown
.rst
.txt
.ipynb
```

It extracts both:

```text
documentation/explanations
code examples
```

from those documents. ([Context7][6])

When sufficient documentation exists, raw source files such as:

```text
.ts
.py
.go
```

are not normally what gets indexed.

Context7 expects the documentation to contain the important usage information.

If a repository has little or no documentation, Context7 can instead fall back to generating documentation/examples from source code for public repositories. ([Context7][6])

---

# 12. The Indexed Representation

The API output gives us a useful clue about how Context7 represents the indexed information.

A result can contain separate categories:

```text
codeSnippets
infoSnippets
```

A code snippet includes fields such as:

```text
codeTitle
codeDescription
codeLanguage
codeTokens
codeId
pageTitle
codeList
```

The example response also shows the original source/documentation URL associated with the snippet.

Information snippets contain fields such as:

```text
pageId
breadcrumb
content
contentTokens
```

The public API therefore treats documentation as **retrievable units/snippets**, rather than simply returning complete documentation pages. ([GitHub][7])

A conceptual representation is:

```text
Documentation page
    │
    ├── explanatory section
    ├── code example
    ├── another section
    ├── another code example
    └── ...
```

which becomes multiple searchable/retrievable pieces.

The exact chunking rules are private.

---

# 13. Chunking: What Is Known and Unknown

We can confidently say:

```text
documents
   ↓
parsed
   ↓
broken into retrievable documentation/code units
   ↓
indexed
```

because Context7 exposes snippet-level retrieval and vector search.

But Context7 does **not publicly document the exact production chunking algorithm**, such as:

```text
fixed 500-token chunks
recursive Markdown splitting
AST-aware code chunking
heading-based chunking
overlapping windows
parent/child chunks
```

Therefore none of those should be presented as facts.

The safest description is:

> Context7 parses documentation into searchable documentation/code snippets and indexes those units for retrieval.

---

# 14. Source Freshness

Context7 continuously refreshes indexed libraries.

Its documentation says that libraries are automatically refreshed based on popularity, and library owners can also trigger refreshes through a GitHub Action on pushes to the default branch. ([Context7][6])

This produces another pipeline:

```text
source repository
       │
       ▼
documentation parser
       │
       ▼
snippet extraction
       │
       ▼
index / embeddings
       │
       ▼
searchable Context7 library
```

The point of this system is to keep the indexed material closer to the current state of the source documentation rather than relying on model training data.

---

# 15. Version Handling

Library results expose available versions.

A Context7 library ID can also contain a specific version, for example:

```text
/vercel/next.js/v14.3.0-canary.87
```

The MCP instructions tell the agent to prefer version-specific IDs when the user explicitly asks about a version. ([GitHub][4])

So version-aware retrieval is part of the architecture:

```text
Next.js
   ↓
available library versions
   ↓
specific version selection
   ↓
version-scoped documentation query
```

This is another reason Context7 is more than generic semantic search.

---

# 16. What the Actual Final Result Looks Like

The API's JSON form contains approximately:

```json
{
  "codeSnippets": [
    {
      "codeTitle": "...",
      "codeDescription": "...",
      "codeLanguage": "typescript",
      "codeTokens": 150,
      "codeId": "...",
      "pageTitle": "...",
      "codeList": [
        {
          "language": "typescript",
          "code": "..."
        }
      ]
    }
  ],
  "infoSnippets": [
    {
      "pageId": "...",
      "breadcrumb": "...",
      "content": "...",
      "contentTokens": 200
    }
  ]
}
```

The public API supports both JSON and text response formats.

However, the MCP implementation itself simply reads the HTTP response body with:

```text
response.text()
```

and returns it as MCP text content.

So the MCP server is not constructing a sophisticated response object itself. The Context7 backend/API is responsible for producing the actual documentation result. ([GitHub][4])

---

# 17. Is This Agentic Search?

Not really, at least not in the usual sense.

Context7 does **not appear to be an autonomous research agent that repeatedly reasons, searches, evaluates, searches again, and decides when to stop**.

Instead, the main architecture is:

```text
Agent
   │
   ├── decide what library it needs
   │
   ├── resolve-library-id
   │
   └── query-docs
          │
          └── retrieval + reranking
```

The external agent controls the tool calls.

The current MCP instructions limit use to at most three calls per question, and the 2.0 architecture explicitly introduced that limit to prevent excessive context retrieval. ([GitHub][3])

So a better description is:

> **agent-directed RAG**, rather than an autonomous search agent.

---

# 18. How "Intelligent" Is the Search?

It helps to separate three levels.

### Level 1: Keyword search

```text
grep
BM25
full-text search
```

This mainly looks for textual similarity.

### Level 2: Semantic/vector retrieval

```text
query embedding
       ↓
nearest documentation vectors
```

This can retrieve conceptually related documentation even when wording differs.

Context7 definitely has this level because its API explicitly exposes vector-search results via `fast=true`. ([Context7][2])

### Level 3: LLM reranking

```text
query
candidate results
      ↓
LLM evaluates relevance
      ↓
better ordering / selection
```

Context7 explicitly uses this layer as well. ([Context7][5])

Therefore:

> **Context7 is at least a semantic/vector retrieval system followed by LLM-based reranking.**

That is substantially more intelligent than ordinary text search.

---

# 19. What Is NOT Publicly Known

This is the most important caveat when discussing Context7's internals.

The public MCP repository is **not the full Context7 implementation**.

Context7 explicitly says that the following supporting components are private:

```text
API backend
parsing engine
crawling engine
```

The public repository contains the MCP server, while the actual retrieval infrastructure lives behind the API. ([GitHub][1])

Therefore the following details cannot currently be verified from public source:

```text
exact embedding model used by Context7 Cloud
exact embedding dimensions
exact vector database
exact ANN algorithm
exact chunking algorithm
exact chunk overlap
exact number of vector candidates
exact LLM reranker model used for each request
exact reranker prompt
exact relevance score formula
exact combination of vector + metadata + quality signals
exact deduplication algorithm
exact filtering thresholds
exact retrieval latency optimizations
```

There is an important distinction here with **Context7 On-Premise**.

For the on-premise product, Context7 allows operators to configure their own:

```text
LLM provider
embedding provider
embedding model
```

and it documents vector storage as part of the deployment. ([Context7][8])

That does **not** mean the hosted Context7 service necessarily uses those same models or implementation details.

---

# 20. The Best Technical Mental Model

The closest accurate abstraction is:

```text
                 ┌─────────────────────┐
                 │   Coding Agent      │
                 │ Claude/Cursor/etc.  │
                 └──────────┬──────────┘
                            │
                  focused natural-language
                         query
                            │
                            ▼
                 ┌─────────────────────┐
                 │    Context7 MCP     │
                 │  protocol adapter   │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
     resolve-library-id              query-docs
              │                           │
              ▼                           ▼
       /v2/libs/search                /v2/context
              │                           │
              └─────────────┬─────────────┘
                            ▼
                 ┌─────────────────────┐
                 │ Context7 Backend    │
                 │                     │
                 │ indexed documents   │
                 │ + vector retrieval  │
                 │ + relevance logic   │
                 └──────────┬──────────┘
                            │
                            ▼
                    LLM reranking
                            │
                            ▼
                 relevant documentation
                    and code snippets
                            │
                            ▼
                     Context7 MCP
                            │
                            ▼
                      Coding agent
```

That is the architecture that can be supported by the current public evidence.

---

# 21. Practical Comparison

| System                 | Contextual/semantic retrieval | LLM reranking | Documentation-specific indexing |
| ---------------------- | ----------------------------: | ------------: | ------------------------------: |
| `grep`                 |                            No |            No |                              No |
| Basic full-text search |                       Limited |            No |                              No |
| Basic vector DB RAG    |                           Yes |    Usually no |                         Depends |
| Vector DB + reranker   |                           Yes |           Yes |                         Depends |
| **Context7**           |                       **Yes** |       **Yes** |                         **Yes** |

The defining feature of Context7 is not merely that it has embeddings.

It combines:

```text
documentation ingestion
+
structured snippet extraction
+
semantic/vector retrieval
+
LLM relevance ranking
+
library/version resolution
+
source-quality metadata
+
continuously refreshed documentation
```

That combination is what makes it useful to coding agents.

---

# 22. The Most Important Insight

The key architectural insight is that **Context7's intelligence is not primarily in the MCP tool itself**.

The MCP tool is comparatively simple:

```text
validate input
→ call Context7 API
→ return response
```

The intelligence resides behind the API:

```text
indexed documentation
        ↓
semantic retrieval
        ↓
candidate selection
        ↓
LLM reranking
        ↓
relevant snippets
```

And the other half of the intelligence comes from the coding agent itself:

```text
user's messy request
        ↓
agent understands intent
        ↓
agent creates focused Context7 query
        ↓
Context7 retrieves relevant documentation
```

So the system is best understood as a **two-layer intelligent retrieval architecture**:

```text
         Agent intelligence
                +
      Context7 retrieval intelligence
                =
          useful documentation
```

---

# 23. Final Answer to the Original Question

**Is Context7 just a dumb search?**

No.

**Does it use intelligent search?**

Yes.

The evidence supports this concrete pipeline:

```text
1. Agent formulates a focused query.

2. Context7 resolves the requested library.

3. Context7 performs vector/semantic retrieval.

4. Context7 uses LLM-based reranking to select/order
   the documentation most relevant to the query.

5. Context7 returns documentation and code snippets
   rather than simply returning whole pages.

6. The agent consumes those snippets as context.
```

The one major limitation on what can be said with certainty is that **Context7's production backend is private**, so the exact embedding model, vector database, chunking algorithm, candidate counts, reranker implementation, and scoring formula are not publicly verifiable.

The strongest defensible description is therefore:

> **Context7 is a documentation-focused RAG system with vector retrieval and LLM reranking, exposed to coding agents through a relatively thin MCP server.**

Sources: Context7 MCP source and changelog, Context7 Public API specification, Context7 documentation on indexing, privacy, and on-premise architecture. ([GitHub][4])

The biggest thing I would take away for building your own system is that **the hard/valuable part is not MCP; it is the retrieval backend and the query/reranking design**.

[1]: https://github.com/upstash/context7?utm_source=chatgpt.com "GitHub - upstash/context7: Context7 Platform -- Up-to-date code documentation for LLMs and AI code editors · GitHub"
[2]: https://context7.com/openapi/context7_openapi_json?utm_source=chatgpt.com "Context7 Public API (openapi/context7_openapi_json) | Context7"
[3]: https://github.com/upstash/context7/blob/master/packages/mcp/CHANGELOG.md?utm_source=chatgpt.com "context7/packages/mcp/CHANGELOG.md at master · upstash/context7 · GitHub"
[4]: https://github.com/upstash/context7/blob/master/packages/mcp/src/index.ts "context7/packages/mcp/src/index.ts at master · upstash/context7 · GitHub"
[5]: https://context7.com/docs/security/data-privacy "Data Privacy - Context7 MCP"
[6]: https://context7.com/docs/adding-libraries "Adding Libraries - Context7 MCP"
[7]: https://github.com/upstash/context7/blob/master/docs/openapi.json "context7/docs/openapi.json at master · upstash/context7 · GitHub"
[8]: https://context7.com/docs/enterprise/on-premise?utm_source=chatgpt.com "On-Premise Deployment - Context7 MCP"
