# Node.js + Express Project

This is a Node.js and Express application that serves as a backend for handling user authentication and interactions with Supabase.

## Project Structure

```
node-express-app
├── src
│   ├── app.js                # Initializes the Express application and sets up middleware
│   ├── controllers           # Contains controllers for handling requests
│   │   └── index.js          # Exports authController with registration and login functions
│   ├── routes                # Defines application routes
│   │   └── index.js          # Exports authRoutes for authentication-related endpoints
│   ├── middlewares           # Contains middleware functions
│   │   └── index.js          # Exports authMiddleware for JWT validation
│   ├── models                # Contains data models (if needed)
│   │   └── index.js          # Placeholder for models
│   └── utils                 # Utility functions
│       └── index.js          # Placeholder for utility functions
├── package.json              # Lists project dependencies
├── .env                      # Environment variables for configuration
├── .gitignore                # Specifies files to ignore in Git
├── README.md                 # Project documentation
└── server.js                 # Entry point for the application
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd node-express-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Environment Variables

Create a `.env` file in the root directory with the following content:

```
SUPABASE_URL=https://ihnvurzeuenwymqqyejz.supabase.co
SUPABASE_KEY=sb_publishable_UG6xnPzh9XPjt7eZbaoJHA_UoRlVMKd
JWT_SECRET=your_jwt_secret_here
```

## Running the Application

To start the application, run:

```
node server.js
```

The application will be available at `http://localhost:3000`.

## Endpoints

- `GET /health`: Returns a health check response.
  
## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.