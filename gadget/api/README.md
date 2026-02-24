# API Routes with Firebase App Check Authentication

This project uses Firebase App Check to secure API endpoints for React Native apps.

## 🔐 Authentication System

### Files Structure
```
api/
├── utils/
│   └── firebase.ts          # Firebase utilities and token verification
├── middleware/
│   └── appCheckAuth.ts      # Authentication middleware
└── routes/
    ├── skio/
    │   └── POST-sendRequest.ts    # Skio GraphQL proxy
    ├── user/
    │   └── POST-profile.ts        # User profile management
    ├── orders/
    │   └── POST-create.ts         # Order creation
    ├── analytics/
    │   └── POST-track.ts          # Analytics tracking
    └── public/
        └── GET-health.ts          # Public health check
```

## 🚀 Creating New Authenticated Routes

### 1. Basic Pattern
```typescript
import { withAppCheckAuth, createAuthenticatedSchema } from '../../middleware/appCheckAuth'

const route = withAppCheckAuth(async ({ request, reply }) => {
  const { yourData } = request.body
  
  // Your business logic here
  // App Check token is already verified
  
  await reply.type('application/json').send({ success: true })
})

route.options = createAuthenticatedSchema({
  yourData: { type: 'string' },
})

export default route
```

### 2. Required Environment Variables
```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-service-account-email
```

### 3. Request Format from React Native
```javascript
const response = await fetch('https://your-app.gadget.app/api/routes/your-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    appCheckToken: appCheckToken, // Required for all authenticated routes
    // ... your other data
  })
});
```

## 📝 API Endpoints

### Authenticated Endpoints
- `POST /api/routes/skio/sendRequest` - Skio GraphQL proxy
- `POST /api/routes/user/profile` - User profile management
- `POST /api/routes/orders/create` - Order creation
- `POST /api/routes/analytics/track` - Analytics tracking

### Public Endpoints
- `GET /api/routes/public/health` - Health check (no auth required)

## ⚠️ Error Responses

All authenticated endpoints return standard error responses:

- `401 MISSING_APP_CHECK_TOKEN` - No App Check token provided
- `401 INVALID_APP_CHECK_TOKEN` - Invalid or expired token
- `500 INTERNAL_ERROR` - Server error

## 🛠 Development

1. **Install dependencies**: `yarn install`
2. **Set environment variables** in your Gadget dashboard
3. **Deploy changes**: Commit to git to deploy to development
4. **Test endpoints** with valid App Check tokens from your React Native app

## 📚 Firebase App Check Setup

1. Enable App Check in Firebase Console
2. Configure your React Native app with App Check
3. Generate service account credentials for server-side verification
4. Set the environment variables in Gadget

For detailed setup instructions, see [Firebase App Check documentation](https://firebase.google.com/docs/app-check).
