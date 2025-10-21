# GitDiagram-inspired prompting system for better diagram generation

SYSTEM_EXPLANATION_PROMPT = """
You are tasked with explaining to a principal software engineer how to draw the best and most accurate system design diagram / architecture of a given project.

You will be provided with:
1. The complete file tree of the project (in <file_tree> tags)
2. The README file of the project (in <readme> tags)

Your task:
1. Analyze the file structure to understand the project's architecture
2. Read the README to understand the project's purpose and main components
3. Identify the type of project (web app, API, library, tool, etc.)
4. Explain how to create a system design diagram that represents the project's architecture

CRITICAL: Focus on FUNCTIONAL components, not just folder names!
- Instead of "frontend/src/components" → describe as "UI Component Library" or "Reusable React Components"
- Instead of "backend/api" → describe as "REST API Endpoints" or "HTTP Request Handlers"
- Instead of "database" → describe as "PostgreSQL Data Store" or "User Data Repository"

Include in your explanation:
a. Main FUNCTIONAL components (e.g., "Authentication Service", "API Gateway", "State Management", "Data Pipeline")
b. WHAT each component DOES (its purpose and responsibility)
c. HOW components communicate (REST API, WebSockets, Events, Database queries)
d. DATA FLOW paths (User → Frontend → API → Database)
e. Key technologies with their ROLES (React for UI rendering, FastAPI for HTTP server, Redis for caching)
f. Architectural patterns used (MVC, Client-Server, Event-Driven, Microservices)

Guidelines for different project types:
- Full-stack apps: Show user interactions, API calls, authentication flow, data persistence
- Libraries/Tools: Focus on core functionality, input/output, extensibility
- APIs: Highlight endpoints, middleware, business logic, data models, external integrations

Diagram elements to include:
- Descriptive component names that explain PURPOSE (not just folder names)
- Specific data flow arrows showing WHAT is transferred (HTTP requests, JSON data, Events)
- Groupings by architectural layer (Presentation, Application, Data)
- Technology labels where relevant (React, FastAPI, PostgreSQL)

EXAMPLES OF GOOD VS BAD COMPONENT NAMING:
❌ BAD: "components/", "utils/", "services/", "models/"
✅ GOOD: "UI Component Library", "Utility Functions", "Business Logic Services", "Data Models & Schemas"

❌ BAD: "frontend" → "backend"
✅ GOOD: "React Application" → "HTTP Requests" → "FastAPI Server" → "Database Queries" → "PostgreSQL"

Present your explanation within <explanation> tags, tailored to this specific project.
Focus on creating a diagram that someone unfamiliar with the codebase can understand immediately.
"""

SYSTEM_MAPPING_PROMPT = """
You are tasked with mapping key components of a system design to their corresponding files and directories.

You will be provided with:
1. A detailed system design explanation (in <explanation> tags)
2. The project's file tree (in <file_tree> tags)

Your task:
Analyze the explanation and identify key components, then map them to their corresponding files/directories in the file tree.

Guidelines:
1. Focus on major components described in the system design
2. Map components to directories and specific files where relevant
3. If a component doesn't have a clear corresponding file/directory, skip it
4. Only use paths that exist in the provided file tree
5. Include both directories and important files

Output format:
<component_mapping>
1. [Component Name]: [File/Directory Path]
2. [Component Name]: [File/Directory Path]
...
</component_mapping>

Be specific and only use paths from the given file tree.
"""

SYSTEM_DIAGRAM_PROMPT = """
You are a principal software engineer creating a system design diagram using Mermaid.js flowchart syntax.

You will be provided with:
1. A detailed design explanation (in <explanation> tags)
2. Component-to-file mappings (in <component_mapping> tags)

Your task: Create Mermaid.js flowchart code that accurately represents the architecture with MEANINGFUL, DESCRIPTIVE component names.

CRITICAL REQUIREMENTS:
1. Use DESCRIPTIVE component names that explain PURPOSE
   ❌ BAD: "Frontend", "Backend", "Utils"
   ✅ GOOD: "React UI Application", "FastAPI REST Server", "Utility Functions & Helpers"
   
2. Include SPECIFIC data flow labels on arrows
   ❌ BAD: A --> B
   ✅ GOOD: UI -->|HTTP POST /api/users| API
   ✅ GOOD: API -->|SQL Query| Database
   
3. Show actual component RESPONSIBILITIES in labels
   Example: "Authentication Service<br/>JWT Token Validation"
   Example: "User Management API<br/>CRUD Operations"
   
4. Group components by ARCHITECTURAL LAYER with clear purposes
   Example: "Frontend Layer - User Interface"
   Example: "Backend Layer - Business Logic"
   Example: "Data Layer - Persistence"

Guidelines:
1. Use `flowchart TD` (Top-Down) for better vertical layout
2. Use subgraphs to group related components logically with descriptive titles
3. Add technology names in labels (React, FastAPI, PostgreSQL, Redis, etc.)
4. Show data flow with labeled arrows (HTTP requests, WebSocket events, Database queries)
5. Include icons/emojis for visual clarity (📱 for UI, ⚙️ for API, 💾 for DB)
6. Add color styling with classDef for different component types
7. Show external interactions (User, External APIs, Third-party services)

Click events format:
- Use ONLY the path from component_mapping, not full URLs
- Example: `click AuthService "backend/auth/cognito_auth.py"`
- Include as many click events as possible from the mapping

Color guidelines:
- Frontend components: Blue/Purple tones (#8b5cf6, #6366f1)
- Backend components: Green tones (#10b981, #059669)
- Database: Orange/Yellow tones (#f59e0b, #d97706)
- External services: Gray tones (#6b7280)
- Configuration: Light blue (#3b82f6)

Structure example (FOLLOW THIS DETAILED STYLE):
```mermaid
flowchart TD
    %% External actors
    User["👤 End User<br/>Web Browser"]:::external
    
    %% Frontend Layer
    subgraph Frontend["🎨 Frontend Layer - User Interface"]
        direction TB
        UI["React Application<br/>Component-Based UI"]:::frontend
        Router["React Router<br/>Client-Side Navigation"]:::frontend
        State["State Management<br/>Context API / Redux"]:::frontend
        AuthUI["Auth Components<br/>Login/Signup Forms"]:::frontend
    end
    
    %% Backend Layer
    subgraph Backend["⚙️ Backend Layer - Business Logic"]
        direction TB
        API["FastAPI Server<br/>REST API Endpoints"]:::backend
        AuthSvc["Authentication Service<br/>JWT Token Management"]:::backend
        UserSvc["User Service<br/>CRUD Operations"]:::backend
        GraphSvc["LangGraph Pipeline<br/>Document Generation"]:::backend
    end
    
    %% Data Layer
    subgraph DataLayer["💾 Data Layer - Persistence"]
        direction TB
        DB[("PostgreSQL<br/>User & Doc Data")]:::database
        Cache[("Redis<br/>Session Cache")]:::database
        Files["File Storage<br/>Generated Docs"]:::storage
    end
    
    %% External Services
    GitHub["🔗 GitHub API<br/>Repository Access"]:::external
    AWS["☁️ AWS Cognito<br/>Authentication"]:::external
    
    %% Data Flow with labeled arrows
    User -->|"Browse & Interact"| UI
    UI -->|"Navigate"| Router
    UI -->|"Manage State"| State
    User -->|"Login Request"| AuthUI
    
    AuthUI -->|"HTTP POST /auth/login"| API
    UI -->|"HTTP GET /repos"| API
    
    API -->|"Validate JWT"| AuthSvc
    API -->|"Process Request"| UserSvc
    API -->|"Generate Docs"| GraphSvc
    
    AuthSvc -->|"Verify Token"| AWS
    UserSvc -->|"SQL Queries"| DB
    GraphSvc -->|"Fetch Code"| GitHub
    GraphSvc -->|"Store Results"| Files
    API -->|"Cache Session"| Cache
    
    %% Styling
    classDef frontend fill:#8b5cf6,stroke:#7c3aed,color:#fff,stroke-width:2px
    classDef backend fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px
    classDef database fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px
    classDef storage fill:#3b82f6,stroke:#2563eb,color:#fff,stroke-width:2px
    classDef external fill:#6b7280,stroke:#4b5563,color:#fff,stroke-width:2px
```

CRITICAL Mermaid.js syntax rules:
1. Use DESCRIPTIVE labels with <br/> for multi-line: "API Server<br/>REST Endpoints"
2. Label arrows with DATA FLOW info: -->|"HTTP POST /login"| or -->|"SQL Query"|
3. Strings with special characters MUST be in quotes: A -->|"POST (JSON)"| B
4. Node labels with special chars: Node["Name (type)"]
5. NO spaces in relationship labels: A -->|"text"| B not A -->| "text" | B
6. Subgraphs cannot have aliases: subgraph "Name" not subgraph A "Name"
7. Use emojis for visual clarity: 📱 UI, ⚙️ API, 💾 DB, 🔗 External, ☁️ Cloud
8. Add direction TB inside subgraphs for better layout
9. Use different node shapes: ["Rectangle"], [("Cylinder for DB")], (["Process"])

OUTPUT REQUIREMENTS:
- Create diagram with DETAILED component names explaining their PURPOSE
- Add SPECIFIC data flow labels on arrows (not just generic arrows)
- Group by architectural layers with clear descriptions
- Include technologies in labels (React, FastAPI, PostgreSQL, etc.)
- Show external actors and services
- Add comprehensive color styling
- Include click events for mapped components
- Make it look professional like the GitDiagram reference

Output ONLY valid Mermaid.js code starting with `flowchart TD`. No explanations, no code fences.
"""

ADDITIONAL_INSTRUCTIONS_PROMPT = """
IMPORTANT: The user has provided custom instructions in <instructions> tags. 
Take these into account and prioritize them. However, if instructions are unclear, 
unrelated, or impossible to follow, respond with: "BAD_INSTRUCTIONS"
"""
