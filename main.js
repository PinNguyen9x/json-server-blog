const jsonServer = require('json-server');
const bodyParser = require('body-parser');
const queryString = require('query-string');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const faker = require('faker');
// const cookieParser = require('cookie-parser');

const server = jsonServer.create();
const db = JSON.parse(fs.readFileSync(path.join('db.json')));
const router = jsonServer.router(db);
const middlewares = jsonServer.defaults();

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

// Use default router
server.use('/api', router);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('JSON Server is running');
});
