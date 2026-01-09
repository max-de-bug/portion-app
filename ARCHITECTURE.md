# Portion Architecture Documentation

## Git Commit Message

Based on recent changes, here's a proper commit message:

```
feat: implement x402 payment backend with AI services and Playwright tests

- Add Fastify backend with x402 protocol implementation
- Implement 6 AI services (GPT-4, Claude 3, DALL-E 3, Whisper, Web Search)
- Add yield calculation and spending logic
- Create Playwright E2E and API test suite
- Fix Tailwind CSS v4 configuration issues
- Add comprehensive documentation (AI_SERVICES.md, TESTING.md)
- Configure CI/CD pipeline for automated testing

Breaking changes: None
Type: Feature
```

**Commit Message Format** (Conventional Commits):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding/updating tests
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

---

## Fastify Backend Architecture

### Overview

Portion uses **Fastify** as the backend framework, a high-performance, low-overhead Node.js web framework designed for speed and developer experience.

### How Fastify Works

#### 1. **Plugin System**

Fastify uses a plugin-based architecture where everything is a plugin:

```typescript
// Register a plugin
await fastify.register(myPlugin, { options });

// Plugins are encapsulated - each has its own scope
await fastify.register(async function (fastify) {
  // This fastify instance is isolated
  fastify.get("/route", handler);
});
```

#### 2. **Request Lifecycle**

```
Request → PreHandler → Handler → PostHandler → Response
         ↓           ↓         ↓             ↓
      Hooks      Validation  Business    Serialization
                              Logic
```

Fastify's lifecycle:

1. **onRequest** - Before request parsing
2. **preParsing** - Before body parsing
3. **preValidation** - Before validation
4. **preHandler** - Before handler
5. **Handler** - Your business logic
6. **preSerialization** - Before response serialization
7. **onSend** - Before sending response
8. **onResponse** - After response sent
9. **onTimeout** - If request times out
10. **onError** - Error handling

#### 3. **Schema-Based Validation**

Fastify uses JSON Schema for validation:

```typescript
const schema = {
  body: {
    type: "object",
    required: ["service", "walletAddress"],
    properties: {
      service: { type: "string" },
      walletAddress: { type: "string", pattern: "^[A-Za-z0-9]{32,44}$" },
    },
  },
};

fastify.post("/route", { schema }, async (request, reply) => {
  // request.body is validated and typed
});
```

#### 4. **Performance Features**

- **JSON parsing**: Uses `fast-json-stringify` (5x faster than `JSON.stringify`)
- **HTTP/2 support**: Built-in HTTP/2 support
- **Async/await**: Native Promise support
- **Low overhead**: Minimal abstraction, close to raw Node.js performance

---

## Current Architecture

### Directory Structure

```
backend/portion-backend/
├── src/
│   ├── app.ts              # Main Fastify application setup
│   ├── routes/             # Route handlers (auto-loaded)
│   │   ├── x402/
│   │   │   └── index.ts    # x402 payment protocol routes
│   │   └── api/
│   │       └── index.ts    # General API routes
│   └── plugins/            # Fastify plugins (auto-loaded)
└── package.json
```

### Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                    http://localhost:3000                     │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP Request
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               Fastify Backend (Port 3001)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. CORS Middleware                                │    │
│  │     - Allows requests from frontend                │    │
│  │     - Handles preflight (OPTIONS)                  │    │
│  └────────────────────────────────────────────────────┘    │
│                        ↓                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  2. AutoLoad Routes                                │    │
│  │     - Scans routes/ directory                      │    │
│  │     - Registers all route files as plugins         │    │
│  └────────────────────────────────────────────────────┘    │
│                        ↓                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  3. Route Handler (x402/index.ts)                  │    │
│  │     ┌────────────────────────────────────────┐    │    │
│  │     │ POST /x402/prepare                      │    │    │
│  │     │ - Validates service exists              │    │    │
│  │     │ - Checks user's spendable yield         │    │    │
│  │     │ - Returns 402 Payment Required          │    │    │
│  │     └────────────────────────────────────────┘    │    │
│  │     ┌────────────────────────────────────────┐    │    │
│  │     │ POST /x402/execute/:service             │    │    │
│  │     │ - Verifies payment allocation           │    │    │
│  │     │ - Executes AI service (mock/prod)       │    │    │
│  │     │ - Records payment                       │    │    │
│  │     │ - Returns result                        │    │    │
│  │     └────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────┘    │
│                        ↓                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  4. Response                                       │    │
│  │     - Fast JSON serialization                     │    │
│  │     - CORS headers added                          │    │
│  │     - Sent back to frontend                       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. **AutoLoad System**

Fastify's `@fastify/autoload` automatically discovers and loads routes/plugins:

```typescript
// app.ts
void fastify.register(AutoLoad, {
  dir: join(__dirname, "routes"), // Auto-discover routes/
  options: opts,
});
```

**How it works:**

- Scans `routes/` directory
- Each file exports a Fastify plugin
- Registers them automatically
- Maintains encapsulation (each route file is isolated)

#### 2. **x402 Route Plugin**

```typescript
// routes/x402/index.ts
const x402Plugin: FastifyPluginAsync = async (fastify) => {
  // This is a Fastify plugin
  fastify.get("/health", handler);
  fastify.post("/prepare", handler);
  // etc...
};

export default x402Plugin;
```

**Plugin benefits:**

- Encapsulation: Each route file has isolated scope
- Reusability: Can register same plugin multiple times
- Configuration: Can pass options when registering

#### 3. **In-Memory Stores**

Currently using `Map` for simplicity (beta/devnet):

```typescript
const verifiedPayments = new Map<string, PaymentData>();
const yieldAllocations = new Map<string, AllocationData>();
```

**Production upgrade:**

- Replace with Redis for distributed systems
- Add database for persistence
- Implement TTL for automatic cleanup

---

## Fastify vs Express.js vs Nest.js

### Performance Comparison

| Framework   | Requests/sec\* | Memory | Startup Time |
| ----------- | -------------- | ------ | ------------ |
| **Fastify** | ~76,000        | Low    | Fast         |
| Express.js  | ~15,000        | Medium | Medium       |
| Nest.js     | ~14,000        | High   | Slow         |

\*Rough benchmarks - varies by workload

### Fastify

**Pros:**

- ⚡ **Fastest** - 2-3x faster than Express
- 🎯 **Schema validation** - Built-in JSON Schema
- 🔌 **Plugin system** - Better encapsulation
- 📊 **Built-in metrics** - Performance monitoring
- 🔒 **TypeScript-first** - Excellent TS support
- 📦 **Small bundle** - Minimal dependencies

**Cons:**

- 📚 **Smaller ecosystem** - Fewer plugins than Express
- 🎓 **Learning curve** - Different from Express patterns
- 🔧 **Less middleware** - Fewer third-party options

**Best for:**

- High-performance APIs
- Microservices
- Real-time applications
- APIs needing validation

**Example:**

```typescript
fastify.post(
  "/user",
  {
    schema: {
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
    },
  },
  async (request, reply) => {
    // request.body.email is validated!
    return { user: await createUser(request.body) };
  }
);
```

---

### Express.js

**Pros:**

- 🌐 **Huge ecosystem** - Tons of middleware (body-parser, cors, etc.)
- 📖 **Well-documented** - Most tutorials use Express
- 👥 **Large community** - Easy to find help
- 🔄 **Flexible** - Can structure however you want
- 🎓 **Familiar** - Most developers know it

**Cons:**

- 🐌 **Slower** - More overhead than Fastify
- ❌ **No built-in validation** - Need libraries (Joi, express-validator)
- 📦 **More dependencies** - Often need many packages
- 🔧 **Manual setup** - More boilerplate

**Best for:**

- Learning Node.js
- Rapid prototyping
- Apps needing specific middleware
- Teams familiar with Express

**Example:**

```javascript
app.post(
  "/user",
  body("email").isEmail(), // Need express-validator
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors });
    }
    // Validation is manual
    res.json({ user: await createUser(req.body) });
  }
);
```

---

### Nest.js

**Pros:**

- 🏗️ **Structured** - Angular-inspired architecture
- 📦 **Built-in DI** - Dependency injection container
- 🔧 **Full-featured** - CLI, testing, GraphQL, WebSockets
- 🎯 **Enterprise-ready** - Great for large teams
- 📚 **Modular** - Modules, controllers, services pattern

**Cons:**

- 🐌 **Heavy** - More overhead (built on Express/Fastify)
- 📚 **Steep learning curve** - Many concepts to learn
- ⚡ **Slower startup** - More abstraction layers
- 🎓 **Opinionated** - Less flexible

**Best for:**

- Large enterprise applications
- Teams wanting structure
- Applications needing many features (GraphQL, WebSockets, etc.)
- Angular developers (familiar patterns)

**Example:**

```typescript
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}

@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto) {
    // Business logic here
  }
}
```

---

## Why Fastify for Portion?

1. **Performance**: Need fast response times for x402 payments
2. **Validation**: Built-in JSON Schema for payment requirements
3. **TypeScript**: Excellent TS support matches our frontend
4. **Plugin System**: Routes are cleanly separated (x402, api)
5. **Low Overhead**: Minimal abstraction - close to raw Node.js
6. **Active Development**: Modern, actively maintained

### Trade-offs

- **Express** would work but slower
- **Nest.js** would be overkill for our simple API structure
- **Fastify** gives us speed + simplicity + validation

---

## Current Implementation Details

### Route Registration

```typescript
// app.ts - Auto-loads all routes
void fastify.register(AutoLoad, {
  dir: join(__dirname, "routes"),
  options: opts,
});

// routes/x402/index.ts - Exports plugin
const x402Plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", handler);
  fastify.post("/prepare", handler);
};

export default x402Plugin;
```

### Request Handling

```typescript
fastify.post<{
  Body: { service: string; walletAddress: string };
}>("/prepare", async (request, reply) => {
  // request.body is typed!
  const { service, walletAddress } = request.body;

  // Validation happens automatically if schema provided
  // Business logic here

  return reply.status(402).send({
    /* ... */
  });
});
```

### Error Handling

```typescript
fastify.setErrorHandler((error, request, reply) => {
  // Centralized error handling
  fastify.log.error(error);
  reply.status(500).send({ error: "Internal Server Error" });
});
```

---

## Summary

**Fastify** was chosen for Portion because it provides:

- High performance for payment processing
- Built-in validation (important for x402 spec)
- Clean plugin architecture
- Excellent TypeScript support
- Active development and modern features

The architecture is simple yet scalable:

- Auto-loaded routes for organization
- Plugin-based for encapsulation
- Ready to scale with Redis/Database
- Easy to add new services/routes
