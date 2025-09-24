# AI Fitness + Nutrition Tracker

A comprehensive fitness and nutrition tracking application with AI-powered meal analysis and planning capabilities.

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** (required)
- **Docker and Docker Compose** (recommended for full stack)
- **MongoDB** (if running without Docker)
- **Redis** (if running without Docker)

### Automated Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd ai-fit-tracker-starter
   ```

2. **Run the setup script:**
   ```bash
   python setup.py
   ```

3. **Start the application:**
   ```bash
   # Option A: Docker (recommended)
   cd docker && docker-compose up -d
   
   # Option B: Local development
   cd server && uvicorn app.main:app --reload
   ```

4. **Access the application:**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health/health
   - MinIO Console: http://localhost:9001 (admin/admin)

### Manual Setup

#### Option 1: Full Stack with Docker (Recommended)

1. **Start all services:**
   ```bash
   cd docker
   docker-compose up -d
   ```

2. **Access the application:**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health/health
   - MinIO Console: http://localhost:9001 (admin/admin)

3. **Stop services:**
   ```bash
   docker-compose down
   ```

#### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   cd server
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your settings
   nano .env
   ```

3. **Start the API server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Start the Celery worker (in another terminal):**
   ```bash
   celery -A celery_app.celery_app worker --loglevel=INFO
   ```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Core Endpoints

#### Health Check
- `GET /health/health` - Basic health check
- `GET /health/detailed` - Detailed health check with database status

#### User Management
- `POST /users/register` - Register a new user
- `POST /users/login` - Login user (returns JWT token)
- `GET /users/me` - Get current user profile (requires authentication)
- `PUT /users/me` - Update user profile (requires authentication)

#### Meal Tracking
- `POST /meals` - Create a meal entry
- `GET /meals` - List meals with filtering
- `GET /meals/{meal_id}` - Get specific meal
- `PUT /meals/{meal_id}` - Update meal
- `DELETE /meals/{meal_id}` - Delete meal
- `GET /meals/daily/{date}` - Get daily nutrition summary

#### Workout Tracking
- `POST /workouts` - Create a workout
- `GET /workouts` - List workouts
- `GET /workouts/{workout_id}` - Get specific workout
- `PUT /workouts/{workout_id}` - Update workout
- `DELETE /workouts/{workout_id}` - Delete workout
- `GET /workouts/strength/progress` - Get strength progress

#### Goals Management
- `POST /goals` - Create a goal
- `GET /goals` - List goals
- `GET /goals/{goal_id}` - Get specific goal
- `PUT /goals/{goal_id}` - Update goal
- `DELETE /goals/{goal_id}` - Delete goal
- `GET /goals/{goal_id}/progress` - Get goal progress

#### AI-Powered Features (Placeholder)
- `GET /meals/presign` - Get presigned URL for image upload
- `POST /meals/scan` - Queue meal image for AI analysis
- `GET /meals/jobs/{task_id}` - Check AI analysis status

### Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🏗️ Architecture

### Backend Stack
- **FastAPI** - Modern, fast web framework for building APIs
- **MongoDB** - Document database for flexible data storage
- **Redis** - In-memory data store for caching and task queuing
- **Celery** - Distributed task queue for background processing
- **MinIO/S3** - Object storage for file uploads
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation and settings management

### Project Structure
```
server/
├── app/
│   ├── core/           # Configuration and utilities
│   ├── infra/          # External service integrations
│   ├── models/         # Data models and schemas
│   ├── routers/        # API route handlers
│   └── workers/        # Background task workers
├── celery_app.py       # Celery configuration
├── requirements.txt    # Python dependencies
└── Dockerfile         # Container configuration
```

## 🔧 Development

### Running Tests
```bash
cd server
python test_api_simple.py
```

### Code Quality
- All code follows Python type hints
- Pydantic models for data validation
- Async/await patterns throughout
- Comprehensive error handling
- Database indexes for optimal performance

### Adding New Features

1. **Models**: Define data structures in `app/models/`
2. **Infrastructure**: Add external service clients in `app/infra/`
3. **Workers**: Create background tasks in `app/workers/`
4. **Routers**: Implement API endpoints in `app/routers/`
5. **Configuration**: Add new settings in `app/core/config.py`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Application environment | `local` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DB` | Database name | `fitapp` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `S3_ENDPOINT` | S3/MinIO endpoint | `http://localhost:9000` |
| `S3_BUCKET` | S3 bucket name | `uploads` |
| `JWT_SECRET_KEY` | JWT signing key | `your-secret-key-change-in-production` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | `30` |

### Mobile Development

The mobile app is built with Expo React Native:

```bash
cd mobile
npm install
npm run web    # For web development
npm run ios    # For iOS (requires Xcode)
npm run android # For Android (requires Android Studio)
```

## 🚧 Current Status

### ✅ Implemented
- Complete API structure with all core endpoints
- User authentication system (JWT-based)
- Meal tracking with manual entry
- Workout tracking with exercise logging
- Goals management system
- Database models and validation
- Docker Compose setup
- Health checks and monitoring

### 🔄 In Progress
- AI-powered meal analysis (placeholder implementation)
- Advanced nutrition calculations
- Strength progress forecasting

### 📋 Planned Features
- React Native mobile app
- Advanced meal planning with optimization
- AI chatbot integration
- Comprehensive analytics and reporting
- Social features and sharing

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation with Pydantic
- Secure file upload with presigned URLs

## 📊 Monitoring

- Health check endpoints
- Structured logging
- Error tracking and reporting
- Performance monitoring ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
1. Check the API documentation at `/docs`
2. Review the health check at `/health/detailed`
3. Check the logs for error details
4. Create an issue in the repository

---

**Note**: This is the base implementation without AI features. AI-powered meal analysis, planning, and chatbot features will be added in subsequent iterations.