graph TB
    subgraph "Client Browser React App"
        U[User] --> App[App.jsx]
        
        subgraph "Feature Authentication"
            App --> AuthProv[AuthProvider.jsx]
            AuthProv --> LoginForm[LoginForm.jsx]
            AuthProv --> useAuth[useAuth hook]
        end
        
        subgraph "Feature Canvas Workspace"
            App --> Canvas[Canvas.jsx]
            Canvas --> Stage[CanvasStage.jsx]
            Stage --> KonvaStage[Konva Stage and Layer]
            Canvas --> Toolbar[Toolbar.jsx]
        end
        
        subgraph "Feature Shape Management"
            Canvas --> ShapeLayer[Shape Rendering]
            ShapeLayer --> Rectangle[Rectangle.jsx]
            ShapeLayer --> useCanvas[useCanvas hook]
            useCanvas --> CanvasHelp[canvasHelpers.js]
        end
        
        subgraph "Feature Real-Time Sync"
            Canvas --> SyncLayer[Sync Manager]
            SyncLayer --> useSync[useRealtimeSync hook]
            useSync --> SyncHelp[syncHelpers.js]
        end
        
        subgraph "Feature Multiplayer Cursors"
            Canvas --> CursorLayer[Cursor Rendering]
            CursorLayer --> Cursor[Cursor.jsx]
            CursorLayer --> useCursor[useCursors hook]
        end
        
        subgraph "Feature Presence Awareness"
            Canvas --> PresenceUI[Presence UI]
            PresenceUI --> UsersList[UsersList.jsx]
            PresenceUI --> usePres[usePresence hook]
        end
        
        subgraph "Supabase Client Library"
            SupaClient[supabase.js Client Instance]
            useAuth --> SupaClient
            useSync --> SupaClient
            useCursor --> SupaClient
            usePres --> SupaClient
        end
    end
    
    subgraph "Supabase Backend Cloud"
        subgraph "Authentication Layer"
            SupaAuth[Supabase Auth Service]
            AuthDB[users and sessions database]
            SupaAuth --> AuthDB
        end
        
        subgraph "PostgreSQL Database"
            DB[PostgreSQL Instance]
            
            subgraph "Canvas Data"
                ObjTable[canvas_objects table]
                ObjCols[Schema: id type x y width height color created_by timestamps]
                ObjTable -.-> ObjCols
            end
            
            subgraph "Presence Data"
                PresTable[user_presence table]
                PresCols[Schema: user_id username cursor_x cursor_y last_seen is_online]
                PresTable -.-> PresCols
            end
            
            DB --> ObjTable
            DB --> PresTable
        end
        
        subgraph "Real-Time Engine"
            RealtimeEngine[Supabase Realtime WebSocket Server]
            PubSub[PostgreSQL LISTEN and NOTIFY]
            
            RealtimeEngine <--> PubSub
            PubSub --> ObjTable
            PubSub --> PresTable
        end
        
        subgraph "Security Layer"
            RLS[Row Level Security Policies]
            RLS -.-> ObjTable
            RLS -.-> PresTable
        end
        
        subgraph "API Layer"
            RestAPI[PostgREST API]
            RestAPI --> DB
        end
    end
    
    subgraph "Deployment Platform"
        Vercel[Vercel CDN and Edge Network]
        Vercel --> Build[Build Process using Vite Bundler]
        Build --> StaticAssets[Static Assets HTML CSS JS bundles]
        StaticAssets -.-> App
    end
    
    subgraph "Development and Testing"
        Dev[Developer]
        Dev --> CursorAI[Cursor AI IDE]
        CursorAI --> Code[Source Code]
        
        subgraph "Test Infrastructure"
            Vitest[Vitest Test Runner]
            
            subgraph "Unit Testing"
                UnitTests[Unit Tests]
                UnitTests --> MockSupa[supabaseMock.js]
                UnitTests --> Fixtures[canvasFixtures.js]
            end
            
            subgraph "Integration Testing"
                IntTests[Integration Tests]
                IntTests --> TestDB[Test Supabase Project]
            end
            
            Vitest --> UnitTests
            Vitest --> IntTests
        end
        
        Code --> Vitest
    end
    
    SupaClient -.->|HTTPS Auth requests| SupaAuth
    SupaClient -.->|REST API CRUD operations| RestAPI
    SupaClient -.->|WebSocket Real-time subscriptions| RealtimeEngine
    
    useSync -.->|1 User creates or moves shape| useCanvas
    useCanvas -.->|2 Optimistic update local| ShapeLayer
    useSync -.->|3 Broadcast to DB| ObjTable
    ObjTable -.->|4 PostgreSQL trigger| PubSub
    PubSub -.->|5 Notify subscribers| RealtimeEngine
    RealtimeEngine -.->|6 Push to all clients| SupaClient
    SupaClient -.->|7 Update remote state| useSync
    
    KonvaStage -.->|Mouse move events throttled| useCursor
    useCursor -.->|Update presence 20-30 per sec| PresTable
    PresTable -.->|Real-time broadcast| RealtimeEngine
    RealtimeEngine -.->|Other users positions| useCursor
    useCursor -.->|Render cursors| CursorLayer
    
    classDef feature fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef deploy fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef test fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef infra fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    
    class AuthProv,LoginForm,useAuth,Canvas,Stage,KonvaStage,Toolbar,Rectangle,useCanvas,SyncLayer,useSync,CursorLayer,Cursor,useCursor,PresenceUI,UsersList,usePres feature
    class SupaAuth,RealtimeEngine,PubSub,RLS,RestAPI backend
    class DB,ObjTable,PresTable,AuthDB database
    class Vercel,Build,StaticAssets deploy
    class Vitest,UnitTests,IntTests,MockSupa,TestDB,Fixtures,Dev,CursorAI,Code test
    class SupaClient infra