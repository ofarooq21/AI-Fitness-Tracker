# 🍽️ NutrifyAI - AI-Powered Fitness & Nutrition Tracker

A modern, full-stack fitness and nutrition tracking application with AI-powered insights, built with React Native Web, FastAPI, and MongoDB.

![NutrifyAI](https://img.shields.io/badge/NutrifyAI-v1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🎯 Core Functionality
- **Macro Tracker** - Log meals with detailed macronutrient tracking
- **Workout Tracker** - Track exercises, sets, reps, and weights
- **Daily Goals** - Set and monitor daily fitness goals (water, steps, protein, custom tasks)
- **AI Insights** - Get personalized fitness and nutrition recommendations powered by OpenAI

### 🎨 Modern UI/UX
- Beautiful gradient designs across all pages
- Responsive and mobile-friendly
- Smooth animations and transitions
- Intuitive navigation and user experience

### 🔐 User Management
- Secure authentication with JWT tokens
- User registration and login
- Profile management
- Data persistence per user

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm**
- **Docker** and **Docker Compose**
- **OpenAI API Key** (for AI insights)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ofarooq21/AI-Fitness-Tracker.git
   cd AI-Fitness-Tracker
   ```

2. **Set up environment variables:**
   ```bash
   cd docker
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Start the backend services:**
   ```bash
   cd docker
   docker-compose up -d
   ```

4. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the frontend:**
   ```bash
   npm run web
   ```

6. **Access the application:**
   - Frontend: http://localhost:8081
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health/health

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **React Native Web** - Cross-platform UI framework
- **Expo** - Development and build tooling
- **TypeScript** - Type-safe JavaScript
- **AsyncStorage** - Local data persistence
- **Expo Linear Gradient** - Beautiful gradient backgrounds

#### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Redis** - Caching and task queue
- **Celery** - Background task processing
- **MinIO** - S3-compatible object storage
- **OpenAI API** - AI-powered insights

### Project Structure

```
ai-fit-tracker-starter/
├── frontend/                 # React Native Web application
│   ├── components/          # UI components
│   │   ├── Dashboard.tsx    # Main dashboard with gradient header
│   │   ├── MacroTracker.tsx # Meal tracking
│   │   ├── WorkoutTracker.tsx # Exercise logging
│   │   ├── AIInsights.tsx   # AI-powered recommendations
│   │   ├── GoalsList.tsx    # Daily goals management
│   │   ├── LoginPage.tsx    # User authentication
│   │   └── RegisterPage.tsx # User registration
│   ├── services/            # API and auth services
│   ├── utils/               # Helper functions
│   └── App.tsx              # Main application entry
├── server/                  # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration
│   │   ├── infra/          # Database and external services
│   │   ├── models/         # Data models
│   │   ├── routers/        # API endpoints
│   │   └── workers/        # Background tasks
│   └── requirements.txt    # Python dependencies
└── docker/                 # Docker configuration
    ├── docker-compose.yml  # Service orchestration
    └── .env               # Environment variables
```

## 📚 API Documentation

### Core Endpoints

#### Authentication
- `POST /users/register` - Create new user account
- `POST /users/login` - Login and get JWT token
- `GET /users/me` - Get current user profile

#### Meals
- `POST /meals` - Log a meal
- `GET /meals` - List user's meals
- `DELETE /meals/{id}` - Delete a meal

#### Workouts
- `POST /workouts` - Log a workout
- `GET /workouts` - List user's workouts
- `DELETE /workouts/{id}` - Delete a workout

#### Goals
- `POST /goals` - Create a goal
- `GET /goals` - List user's goals
- `PUT /goals/{id}` - Update goal progress
- `DELETE /goals/{id}` - Delete a goal

#### AI Insights
- `GET /insights/ai` - Get personalized AI recommendations

**Full API documentation available at:** http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `docker/` directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here

# Database
MONGO_URL=mongodb://mongo:27017
MONGO_DB=fitapp

# Redis
REDIS_URL=redis://redis:6379/0

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=uploads

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=*
```

## 🎨 UI Components

### Gradient Themes
- **Dashboard**: Purple-pink gradient (`#667eea → #764ba2 → #f093fb`)
- **Macro Tracker**: Purple gradient (`#667eea → #764ba2`)
- **Workout Tracker**: Pink-red gradient (`#f093fb → #f5576c`)
- **AI Insights**: Green gradient (`#43e97b → #38f9d7`)
- **Daily Goals**: Blue gradient (`#4facfe → #00f2fe`)
- **Login/Register**: Full-screen purple-pink gradient

### Design System
- **Typography**: Bold fonts (700-800 weight) for headers
- **Shadows**: Elevated cards with soft shadows
- **Borders**: Rounded corners (16-24px radius)
- **Spacing**: Consistent padding and margins
- **Colors**: Vibrant gradients with white/translucent overlays

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd server
pytest
```

## 📦 Deployment

### Docker Deployment (Recommended)

1. **Build and start all services:**
   ```bash
   cd docker
   docker-compose up -d --build
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f api
   ```

### Production Considerations

- Set strong `JWT_SECRET_KEY`
- Use environment-specific `OPENAI_API_KEY`
- Configure proper `ALLOWED_ORIGINS` for CORS
- Set up SSL/TLS certificates
- Configure database backups
- Set up monitoring and logging
- Use a reverse proxy (nginx/Caddy)

## 🔐 Security

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Input validation with Pydantic
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection
- ✅ Rate limiting ready

## 📊 Data Models

### User
- Profile information (name, email, password)
- Optional: date of birth, gender, height, weight, activity level

### Meal
- Name, calories, protein, fat, carbs
- Meal type (breakfast, lunch, dinner, snack)
- Portion estimate
- Timestamp

### Workout
- Name, date, duration
- Exercises with sets, reps, and weights
- Exercise categories (strength, cardio, flexibility, sports)

### Goal
- Type (long-term or daily)
- Target metrics
- Progress tracking
- Status (active, completed, cancelled)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for AI-powered insights
- FastAPI for the excellent web framework
- Expo for React Native tooling
- MongoDB for flexible data storage

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ by the NutrifyAI Team**
