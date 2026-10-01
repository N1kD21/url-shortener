# Architecture

These diagrams are written in [Mermaid](https://mermaid.js.org/). GitHub renders them as images directly in this file; most editors (VS Code with a Mermaid extension, JetBrains IDEs) render them in Markdown preview too.

## Components

How a request travels through the service.

```mermaid
flowchart LR
    client([Client<br/>browser / curl])

    subgraph app [NestJS application]
        direction LR
        pipe[ValidationPipe<br/>global, checks request bodies]
        ctrl[LinksController<br/>HTTP in / HTTP out]
        svc[LinksService<br/>business logic]
        gen[generateShortCode<br/>random base62]
        prisma[PrismaService<br/>database client]
        swagger[Swagger UI<br/>/docs]
    end

    db[(SQLite<br/>table Link)]

    client -->|POST /shorten<br/>GET /:code<br/>GET /stats/:code| pipe
    pipe --> ctrl
    ctrl --> svc
    svc --> gen
    svc --> prisma
    prisma --> db
    client -.->|GET /docs| swagger
```

## Data model

```mermaid
erDiagram
    Link {
        Int id PK "autoincrement"
        String code UK "7 chars, base62, unique index"
        String originalUrl "http(s), up to 2048 chars"
        Int visits "default 0, +1 per redirect"
        DateTime createdAt "default now()"
    }
```

## POST /shorten

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant V as ValidationPipe
    participant S as LinksService
    participant DB as SQLite

    C->>V: POST /shorten {"url": "..."}
    alt url missing, not a string, malformed, too long, or unknown fields
        V-->>C: 400 {statusCode, error, message[]}
    else body is valid
        V->>S: shorten(url)
        loop up to 5 attempts
            S->>S: generate random 7-char code
            S->>DB: INSERT Link (code, originalUrl)
            alt code already exists (unique index violation)
                DB-->>S: P2002, try another code
            else inserted
                DB-->>S: new row
            end
        end
        S-->>C: 201 {code, shortUrl, originalUrl}
    end
```

## GET /:code

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant S as LinksService
    participant DB as SQLite
    participant T as Original site

    C->>S: GET /aZ3kQ9x
    S->>DB: UPDATE Link SET visits = visits + 1<br/>WHERE code = 'aZ3kQ9x'
    alt code exists
        DB-->>S: originalUrl
        S-->>C: 302 Found, Location: originalUrl
        C->>T: browser follows the redirect
    else no such code
        DB-->>S: P2025, record not found
        S-->>C: 404 {statusCode, error, message}
    end
```

The lookup and the visit count are a single atomic statement, so concurrent visits are never lost. The status is 302, not 301, because browsers cache a 301 and would stop hitting the service, which would freeze the counter.

## GET /stats/:code

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant S as LinksService
    participant DB as SQLite

    C->>S: GET /stats/aZ3kQ9x
    S->>DB: SELECT * FROM Link WHERE code = 'aZ3kQ9x'
    alt code exists
        DB-->>S: row
        S-->>C: 200 {code, originalUrl, visits, createdAt}
    else no such code
        DB-->>S: null
        S-->>C: 404 {statusCode, error, message}
    end
```

Reading stats never changes the counter.

## Startup

```mermaid
flowchart TD
    A[Read PORT, BASE_URL, DATABASE_URL<br/>defaults if unset] --> B[Create Nest app<br/>PrismaModule + LinksModule]
    B --> C[Register global ValidationPipe]
    C --> D[Register Swagger UI at /docs<br/>before the catch-all /:code route]
    D --> E[Connect to SQLite]
    E --> F[Listen on PORT]

    subgraph docker [In Docker only, before the app starts]
        M[prisma migrate deploy<br/>creates or updates the database file]
    end
    M --> A
```
