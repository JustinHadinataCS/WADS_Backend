# Semesta Medika Backend

A comprehensive healthcare management system backend built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Management**
  - Authentication (JWT & Google OAuth)
  - Role-based access control (Admin, Doctor, Patient)
  - User profile management

- **Ticket System**
  - Create and manage support tickets
  - Priority levels and categories
  - Department assignment
  - Status tracking

- **Appointment Management**
  - Schedule medical appointments
  - Doctor availability tracking
  - Appointment status updates
  - Patient history

- **Notification System**
  - Real-time notifications
  - Email notifications
  - Customizable notification preferences
  - Multiple notification types (appointments, tickets, system alerts)

- **Medical Records**
  - Patient medical history
  - Diagnosis management
  - Prescription tracking
  - Lab results

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: 
  - JWT (JSON Web Tokens)
  - Passport.js
  - Google OAuth2.0
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI
- **Security**: 
  - Helmet.js
  - CORS
  - Rate limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google OAuth credentials
- npm or yarn

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/semesta-medika-backend.git
   cd semesta-medika-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=your_mongodb_uri

   # JWT Configuration
   JWT_SECRET=your_jwt_secret

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

4. Start the server:
   ```bash
   npm start
   ```

## 📚 API Documentation

API documentation is available via Swagger UI at:
```
http://localhost:5000/api-docs
```

The documentation includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests

## 🔐 Authentication

The API supports two authentication methods:

1. **JWT Authentication**
   - Used for regular email/password login
   - Token must be included in Authorization header
   - Format: `Bearer <token>`

2. **Google OAuth**
   - Enables "Sign in with Google"
   - Requires valid Google OAuth credentials
   - Automatically creates user account on first login

## 🚦 API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/preferences` - Update notification preferences

## 🔄 Error Handling

The API uses standard HTTP status codes:
- `2xx` - Success
- `4xx` - Client errors
- `5xx` - Server errors

Detailed error messages are provided in the response body.

## 🛡️ Security

- CORS enabled
- Rate limiting implemented
- Helmet.js for security headers
- Password hashing
- JWT token encryption
- Input validation
- MongoDB injection prevention

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@semestamedika.com or create an issue in the repository. 