const jsonServer = require('json-server');
const bodyParser = require('body-parser');
const queryString = require('query-string');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const faker = require('faker');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const server = jsonServer.create();

// Create/update db.json file with initial data
const dbPath = path.join(__dirname, 'db.json');
const initialData = {
  posts: [
    {
      id: '1',
      title: 'First Post',
      author: 'John Doe',
      // ... other post properties
    },
  ],
  works: [
    {
      id: '1',
      title: 'Project 1',
      status: 'published',
      // ... other work properties
    },
  ],
  profile: {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    city: 'Example City',
  },
};

// Write initial data to db.json if it doesn't exist
try {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
    console.log('Created new db.json file with initial data');
  }
} catch (err) {
  console.error('Error creating db.json:', err);
}

// Use the physical db.json file instead of in-memory object
const router = jsonServer.router(dbPath);

const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'public'),
});

// Define Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'JSON Server API',
      description: 'API documentation for JSON Server endpoints',
      version: '1.0.0',
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    servers: [
      {
        url: process.env.VERCEL_URL
          ? 'json-server-blog.vercel.app/api'
          : 'http://localhost:3000/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            author: { type: 'string' },
            createdAt: { type: 'integer', format: 'int64' },
            updatedAt: { type: 'integer', format: 'int64' },
            slug: { type: 'string' },
            publishedDate: { type: 'string', format: 'date-time' },
            tagList: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
          },
        },
        Work: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['published', 'draft'] },
            slug: { type: 'string' },
            frontEndTagList: { type: 'array', items: { type: 'string' } },
            thumbnailUrl: { type: 'string' },
            tagList: { type: 'array', items: { type: 'string' } },
            fullDescription: { type: 'string' },
            shortDescription: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            linkDemo: { type: 'string' },
            linkSource: { type: 'string' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', minimum: 4 },
            password: { type: 'string', minimum: 6 },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            expiredAt: { type: 'integer', format: 'int64' },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string' },
            city: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/posts': {
        get: {
          tags: ['Posts'],
          summary: 'Get all posts',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: '_page',
              schema: { type: 'integer' },
              description: 'Page number',
            },
            {
              in: 'query',
              name: '_limit',
              schema: { type: 'integer' },
              description: 'Number of items per page',
            },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Post' },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          _page: { type: 'integer' },
                          _limit: { type: 'integer' },
                          _totalRows: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/works': {
        get: {
          tags: ['Works'],
          summary: 'Get all works',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: '_page',
              schema: { type: 'integer' },
            },
            {
              in: 'query',
              name: '_limit',
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Work' },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          _page: { type: 'integer' },
                          _limit: { type: 'integer' },
                          _totalRows: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login to get access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Successful login',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Get user profile',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Profile' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger JSON
server.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI at /api-docs
server.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'swagger.html'));
});

// server.use(cookieParser());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(middlewares);
// Set locale to use Vietnamese
faker.locale = 'vi';

const SECRET_KEY = '123456789';
const expiresIn = '1h';

function createToken(payload, expiresIn) {
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn });
  const expiredAt = Date.now() + 3600 * 1000;
  return { token, expiredAt };
}
// Verify the token
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

// Check if the user exists in database
function isAuthenticated({ username, password }) {
  if (!username || !password) return false;
  return username.trim().length >= 4 && password.trim().length >= 6;
}

server.get('/api/profile', async (req, res) => {
  if (
    req.headers.authorization === undefined ||
    req.headers.authorization.split(' ')[0] !== 'Bearer'
  ) {
    const status = 401;
    const message = 'Error in authorization format';
    res.status(status).json({ status, message });
    return;
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    const verifyTokenResult = verifyToken(token);
    if (verifyTokenResult instanceof Error) {
      return res.status(401).json({ status: 401, message: 'Access token not provided' });
    }
    // mock user profile
    const userProfile = {
      id: verifyTokenResult.id,
      username: verifyTokenResult.username,
      email: faker.internet.email(),
      city: faker.address.city(),
    };

    res.status(200).json(userProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
});
// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

server.post('/api/login', async (req, res) => {
  console.log('login endpoint called; request body:');
  console.log(req.body);
  const { username = '', password = '' } = req.body;
  if (isAuthenticated({ username, password }) === false) {
    const status = 401;
    const message = 'Incorrect username or password';
    res.status(status).json({ status, message });
    return;
  }
  try {
    const id = faker.datatype.uuid();
    const { token: access_token, expiredAt } = createToken({ id, username }, expiresIn);
    console.log('Access Token:', access_token);
    res.status(200).json({ access_token, expiredAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
});

// Add custom routes before JSON Server router
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  if (req.method === 'POST') {
    req.body.createdAt = Date.now();
    req.body.updatedAt = Date.now();
  } else if (req.method === 'PATCH') {
    req.body.updatedAt = Date.now();
  }

  // Continue to JSON Server router
  next();
});

// Custom output for LIST with pagination
router.render = (req, res) => {
  // Check GET with pagination
  // If yes, custom output
  const headers = res.getHeaders();

  const totalCountHeader = headers['x-total-count'];
  if (req.method === 'GET' && totalCountHeader) {
    const queryParams = queryString.parse(req._parsedUrl.query);

    const result = {
      data: res.locals.data,
      pagination: {
        _page: Number.parseInt(queryParams._page) || 1,
        _limit: Number.parseInt(queryParams._limit) || 10,
        _totalRows: Number.parseInt(totalCountHeader),
      },
    };

    return res.jsonp(result);
  }

  // Otherwise, keep default behavior
  res.jsonp(res.locals.data);
};

// Add custom route for root path
server.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>JSON Server</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container mt-5">
          <div class="jumbotron">
            <h1 class="display-4">Welcome to JSON Server!</h1>
            <p class="lead">Congratulations! You've successfully started JSON Server 🎉</p>
            <hr class="my-4">
            <p>Available Resources:</p>
            <ul>
              <li><a href="/api/posts">/api/posts</a></li>
              <li><a href="/api/works">/api/works</a></li>
              <li><a href="/api/profile">/api/profile</a></li>
            </ul>
            <p>View API documentation at: <a href="/api-docs">/api-docs</a></p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Use default router
server.use('/api', router);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('JSON Server is running');
});
