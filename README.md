# FLARE 

A comprehensive disaster management platform built with React, designed to help organizations, admins, and citizens coordinate during emergencies.

## 🚀 Features

- **Authentication System**
  - User login and registration
  - Role-based access (Organization, Admin, Citizen)
  - Account approval workflow for organizations
  
- **Interactive Maps**
  - Real-time disaster location tracking
  - Shelter location mapping
  - Interactive map interface using Leaflet

- **Core Modules**
  - Shelter Management
  - Incident Reports
  - Lost & Found
  - Donation Management
  - User Settings

## 🛠️ Tech Stack

- **Frontend Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.2
- **Styling:** 
  - Tailwind CSS 4.1.17
  - Material-UI 7.3.5
  - Custom CSS
- **State Management:** Redux Toolkit 2.10.1
- **Routing:** React Router DOM 7.9.6
- **Maps:** 
  - Leaflet 1.9.4
  - React Leaflet 5.0.0
- **Icons:** 
  - Material-UI Icons
  - React Icons 5.5.0
- **HTTP Client:** Axios 1.13.2

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn package manager
- Git

## 🔧 Installation

1. Clone the repository
```bash
git clone <your-repository-url>
cd FLARE-FYP
```

2. Navigate to the project directory
```bash
cd flare
```

3. Install dependencies
```bash
npm install
```

4. Set up environment variables
```bash
# Create a .env file in the flare directory
cp .env.example .env
```

5. Add your API keys to the `.env` file
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
The application will start at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 📁 Project Structure

```
FLARE-FYP/
├── flare/
│   ├── src/
│   │   ├── assets/          # Static assets (images, etc.)
│   │   ├── components/      # Reusable components
│   │   │   └── Navbar.jsx
│   │   ├── features/        # Redux slices
│   │   │   ├── auth/
│   │   │   └── shelters/
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Authentication pages
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── SignUp.jsx
│   │   │   │   ├── createAcc.jsx
│   │   │   │   └── ApprovalScreen.jsx
│   │   │   ├── stubs/       # Feature pages
│   │   │   └── Maps.jsx
│   │   ├── routes/          # Route configuration
│   │   │   └── AppRoutes.jsx
│   │   ├── store/           # Redux store
│   │   │   └── store.js
│   │   ├── styles/          # Global styles
│   │   │   └── index.css
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Public assets
│   │   ├── logo.png
│   │   └── illustration.png
│   ├── .env                 # Environment variables (not committed)
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── eslint.config.js
└── README.md
```

## 🎨 Design Features

- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Theme Colors:**
  - Primary Blue: `#577a92`
  - Dark Blue: `#345f86`
  - White: `#ffffff`
  - Light Gray: `#fbfcff`
- **Custom Fonts:**
  - Lexend (headings)
  - Inter (body text)

## 🔐 Authentication Flow

1. **Create Account** - Users select their role (Organization/Admin/Citizen)
2. **Sign Up** - Complete registration with email, contact, username, and password
3. **Approval** - Organizations require admin approval before access
4. **Login** - Access the platform with credentials

## 🗺️ Maps Integration

The application uses Leaflet for interactive maps with:
- Custom markers for disaster locations
- Shelter location markers
- Real-time location updates
- Zoom and pan controls

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Environment Variables

Required environment variables in `.env`:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key for map features | Yes |

## 🐛 Known Issues

- None currently reported

## 📄 License

This project is part of a Final Year Project (FYP).

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Material-UI for the component library
- Leaflet for mapping capabilities
- React community for excellent documentation
