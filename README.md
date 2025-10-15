# CollabCanvas MVP

A real-time collaborative canvas application where multiple users can simultaneously create, move, and manipulate shapes while seeing each other's cursors and presence in real-time.

## 🎉 MVP Status: COMPLETE!

All core features are working and ready for production use.

## 🚀 Features

- ✅ **Authentication** - Email/password authentication with Supabase
- ✅ **Canvas Foundation** - Pan and zoom around a large workspace (5000x5000px)
- ✅ **Shape Creation** - Create and manipulate rectangles, circles, and text boxes
- ✅ **Color Selection** - Choose from 10 preset colors
- ✅ **Real-Time Sync** - Sync changes across multiple users in real-time
- ✅ **Multiplayer Cursors** - See other users' cursor positions with usernames
- ✅ **Presence Awareness** - See who's online with colored user dots
- ✅ **TextBox Editing** - Advanced text editing with ownership locks
- ✅ **State Persistence** - Canvas state saved to database and restored on refresh

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Canvas Library:** Konva.js + react-konva
- **Backend:** Supabase (Authentication + PostgreSQL + Realtime)
- **Styling:** CSS3
- **State Management:** React Hooks

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd CanvasCollab
```

### 2. Install Dependencies

```bash
npm install
```

The project uses:
- `@supabase/supabase-js` - Supabase client
- `react-konva` and `konva` - Canvas library
- `uuid` - ID generation
- `react` and `react-dom` - React framework

### 3. Setup Supabase

#### Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy your project URL and anon key

#### Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace with your actual Supabase credentials from your project dashboard.

#### Setup Database Schema

Run the SQL migration script in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations.sql` from this repository
4. Execute the script to create all required tables, policies, and functions

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🎮 Usage

1. **Sign Up/Login** - Create an account with email/password or login with existing credentials
2. **Create Shapes** - Click "Rectangle", "Circle", or "Text" buttons in the toolbar
3. **Move Shapes** - Click and drag shapes to move them around the canvas
4. **Resize Shapes** - Select a shape to show resize handles, drag to resize
5. **Edit Text** - Double-click text boxes to edit text content
6. **Pan Canvas** - Click and drag on empty space to pan around
7. **Zoom** - Use mouse wheel to zoom in/out
8. **Change Colors** - Click color buttons in the toolbar to select different colors
9. **See Other Users** - View online users in the sidebar and their cursors on the canvas

## 📁 Project Structure

```
CanvasCollab/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Auth/       # Authentication components
│   │   ├── Canvas/     # Canvas and shape components
│   │   ├── Toolbar/    # Toolbar component
│   │   └── Presence/   # User presence components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Library configurations (Supabase, constants)
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── .env.local          # Environment variables (not committed)
├── package.json        # Dependencies
└── vite.config.js      # Vite configuration
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [https://netlify.com](https://netlify.com)
3. Import your repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables in Site Settings
7. Deploy!

## 🗄️ Database Schema

The application uses the following Supabase tables:

- **`profiles`** - User profiles with usernames and display names
- **`canvas_objects`** - All shapes (rectangles, circles, text boxes) with positions, colors, and content
- **`user_presence`** - Real-time user presence and cursor positions

All tables include Row Level Security (RLS) policies and real-time subscriptions for collaborative features.

## 🐛 Troubleshooting

### Environment Variables Not Loading

- Make sure `.env.local` is in the root directory
- Restart the development server after creating/editing `.env.local`
- Check that variables start with `VITE_` prefix

### Supabase Connection Issues

- Verify your Supabase URL and anon key are correct
- Ensure the database schema has been set up using `migrations.sql`
- Check that real-time subscriptions are enabled in Supabase dashboard
- Check browser console for specific error messages

### Canvas Not Rendering

- Check browser console for errors
- Verify all dependencies are installed (`npm install`)
- Try clearing browser cache and restarting dev server

## 📝 Development Roadmap

- [x] **Phase 1:** Project Setup & Authentication ✅
- [x] **Phase 2:** Canvas Foundation (Single User) ✅
- [x] **Phase 3:** Shape Creation & Manipulation ✅
- [x] **Phase 4:** Real-Time Sync (Multi-User) ✅
- [x] **Phase 5:** State Persistence ✅
- [x] **Phase 6:** Presence Awareness ✅
- [x] **Phase 7:** Polish & Testing ✅
- [ ] **Phase 8:** Final Deployment & Documentation

### 🎯 Next Steps (Post-MVP):
- Advanced ownership system with conflict resolution
- Shape deletion functionality
- Keyboard shortcuts
- Mobile support
- Performance optimizations for 10+ users

## 📄 License

MIT

## 🤝 Contributing

This is an MVP project. Contributions are welcome!

## 📧 Contact

For questions or issues, please open an issue on GitHub.
