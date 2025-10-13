# CollabCanvas MVP

A real-time collaborative canvas application where multiple users can simultaneously create, move, and manipulate shapes while seeing each other's cursors and presence in real-time.

## 🚀 Features

- ✅ **Authentication** - Username-only authentication with Supabase
- ✅ **Canvas Foundation** - Pan and zoom around a large workspace (5000x5000px)
- ✅ **Shape Creation** - Create and manipulate rectangles with drag-and-drop
- ✅ **Color Selection** - Choose from 5 preset colors
- 🔄 **Real-Time Sync** - (Coming soon) Sync changes across multiple users
- 👥 **Multiplayer Cursors** - (Coming soon) See other users' cursor positions
- 🟢 **Presence Awareness** - (Coming soon) See who's online

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

#### Enable Anonymous Sign-ins

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll to **Auth Providers**
4. Enable **Anonymous sign-ins**

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

1. **Login** - Enter any username to join the canvas
2. **Add Rectangles** - Click the "Add Rectangle" button in the floating toolbar
3. **Move Rectangles** - Click and drag rectangles to move them
4. **Pan Canvas** - Click and drag on empty space to pan around
5. **Zoom** - Use mouse wheel to zoom in/out
6. **Change Colors** - Click color buttons in the toolbar to select different colors

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

## 🗄️ Database Setup (For Multiplayer Features)

To enable real-time multiplayer features, you need to create database tables in Supabase.

### Coming Soon:
- SQL scripts for database tables
- Real-time synchronization setup
- Multiplayer cursor tracking
- Presence awareness

## 🐛 Troubleshooting

### Environment Variables Not Loading

- Make sure `.env.local` is in the root directory
- Restart the development server after creating/editing `.env.local`
- Check that variables start with `VITE_` prefix

### Supabase Connection Issues

- Verify your Supabase URL and anon key are correct
- Check that anonymous sign-ins are enabled in Supabase dashboard
- Check browser console for specific error messages

### Canvas Not Rendering

- Check browser console for errors
- Verify all dependencies are installed (`npm install`)
- Try clearing browser cache and restarting dev server

## 📝 Development Roadmap

- [x] PR #1: Project Setup & Configuration
- [x] PR #2: Authentication Implementation
- [x] PR #3: Canvas Foundation (Single User)
- [ ] PR #4: Supabase Database Schema
- [ ] PR #5: Real-Time Object Synchronization
- [ ] PR #6: Multiplayer Cursors
- [ ] PR #7: Presence Awareness
- [ ] PR #8: State Persistence
- [ ] PR #9: Performance Optimization & Bug Fixes
- [ ] PR #10: Polish & Documentation

## 📄 License

MIT

## 🤝 Contributing

This is an MVP project. Contributions are welcome!

## 📧 Contact

For questions or issues, please open an issue on GitHub.
