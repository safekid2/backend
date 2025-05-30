# Safe Kids - School Pickup Verification System

A secure system for managing and verifying student pickups using QR codes. This backend API is built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Role-based access control (Admin, Staff, Parent)
- Student and parent management
- QR code generation for authorized pickups
- Pickup verification system
- Activity logging

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd safe-kids-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add the following:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/safe-kids
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The API will be available at `http://localhost:5000`

## API Documentation

### Authentication

#### Login
```
POST /api/v1/auth/login
```

Request body:
```json
{
  "email": "parent@example.com",
  "password": "password123"
}
```

### Parents

#### Get all parents (Admin only)
```
GET /api/v1/parents
```

#### Create a new parent (Admin only)
```
POST /api/v1/parents
```

Request body:
```json
{
  "name": "John Doe",
  "email": "parent@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "children": ["studentId1", "studentId2"]
}
```

### Students

#### Get all students (Admin only)
```
GET /api/v1/students
```

#### Create a new student (Admin only)
```
POST /api/v1/students
```

Request body:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "studentId": "STU123",
  "grade": "3A",
  "dateOfBirth": "2015-05-15",
  "parents": ["parentId1", "parentId2"]
}
```

### Verification

#### Verify pickup (Staff/Admin only)
```
POST /api/v1/verify-pickup
```

Request body:
```json
{
  "qrCodeData": "{ \"studentId\": \"...\", \"parentId\": \"...\", \"code\": \"...\" }"
}
```

#### Get pickup logs (Staff/Admin only)
```
GET /api/v1/logs
```

## Environment Variables

- `PORT` - Port to run the server on (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRE` - JWT expiration time (e.g., 30d)

## Testing

To run tests:

```bash
npm test
# or
yarn test
```

## License

This project is licensed under the MIT License.
