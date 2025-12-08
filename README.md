# Real-Time Chat Application 💬

A modern, full-featured real-time chat application built with React and Supabase.

## Features

- **Email/Password Authentication** - Secure user registration and login
- **Real-time Messaging** - Instant message delivery and updates
- **Online/Offline Status** - Track user presence in real-time
- **File & Image Sharing** - Send and receive media files
- **User Search** - Find and connect with other users
- **Profile Management** - Edit username, profile picture, and about section
- **Fully Responsive** - Optimized for all devices

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Supabase (Authentication, Realtime Database, Storage)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Setup

1. Clone the repository
```bash
git clone https://github.com/Prateet-Github/chat-app.git
cd chat-app
```

2. Install dependencies
```bash
npm install
```

3. Configure Supabase
- Create a project at [supabase.com](https://supabase.com)
- Copy your project URL and anon key
- Update `.env` with your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Run the development server
```bash
npm run dev
```

## Project Structure

```
chat-app/
├── public/Images/      # Static assets
├── src/               # Source code
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── lib/          # Supabase client
│   └── utils/        # Helper functions
├── .env              # Environment variables
└── vite.config.js    # Vite configuration
```

## Key Learnings

Building this project enhanced skills in:
- Real-time systems and WebSocket communication
- Authentication flows and user management
- Database integration and queries
- File storage and handling
- Responsive UI design

## License

Open source project.

---

Built with React, Supabase, and Tailwind CSS