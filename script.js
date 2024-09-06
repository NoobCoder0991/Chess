// Required Modules
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require("path")
// const db = require("./database/dbmethods")
const helper_functions = require("./helper_functions");
const stockfishConnections = require("./stockfish_connections");
const chess = require("./chess")
const playOnlineConnections = require("./play_online_connections");
const playMycomputerConnections = require("./play_mycomputer_connections");
const signupConnections = require("./signup")
const lichess = require("./lichessAPI");
const { handleDatabase } = require("./database");


app.use(cookieParser())
const sessionMiddleware = session({
  secret: 'ddfd58d8f5d53#@%hgg55$#',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 3600000 // Session expiration time in milliseconds (1 hour in this example)
  }
});

app.use(sessionMiddleware);

app.set('view engine', 'pug');

// Set the directory where your Pug templates are located
app.set('views', path.join(__dirname, '/views'));


app.use(bodyParser.json());
app.use(express.static(path.join('public')));



const isAuthenticated = async (req, res, next) => {
  const db = await handleDatabase("Chess");
  let sessionId = req.session.sessionId;
  const user = await db.collection("session_tokens").findOne({ token: { session_id: sessionId, expired: false } });
  if (user) {
    // User is authenticated, allow access to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page
    res.redirect('/login');
  }
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/src/index.html"))
});
app.get('/profile', async (req, res) => {
  const db = await handleDatabase("Chess")
  let sessionId = req.session.sessionId;
  const user = await db.collection("session_tokens").findOne({ "token.session_id": sessionId, "token.expired": false });
  if (user) {
    const userid = user.userid;
    const userInfo = await db.collection("game_info").findOne({ userid: userid });

    res.render('profile', userInfo.info)
  }
  else {
    res.redirect('/login?returnUrl=profile')
  }

})

app.get("/signup", (req, res) => {
  res.sendFile(
    path.join(__dirname, "/public/src/signup.html")
  );
  // res.send("<h1>404- Not Found</h1><br><a href='/'>Home</a>")
});
app.get("/login", async (req, res) => {
  const db = await handleDatabase("Chess")
  let sessionId = req.session.sessionId;
  const user = await db.collection("session_tokens").findOne({ token: { session_id: sessionId } });
  if (user) {
    res.redirect('/play')
  }
  else {

    res.sendFile(
      path.join(__dirname, "/public/src/login.html")
    );
  }
});

app.get("/play", isAuthenticated, (req, res) => {

  res.sendFile(path.join(__dirname, "/public/src/play.html"))
});
app.get("/dialy/puzzle", isAuthenticated, (req, res) => {

  res.sendFile(path.join(__dirname, "/public/src/puzzle.html"))
});



app.get('/games', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "/public/src/all_games.html"))

})

app.get("/logged-out", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/src/logged-out.html"))

})
app.post('/recape-game', async (req, res) => {
  const db = await handleDatabase("Chess")
  const data = req.body.gameInfo
  const game = chess.decodeGame(data.game, data.perspective);
  data.game = game
  let sessionId = req.session.sessionId;
  const user = await db.collection('session_tokens').findOne({ token: { session_id: sessionId, expired: false } });
  if (user) {
    let url = '/games/' + data.gameId;
    res.send({ ok: true, url: url })
    app.get(url, (req, res) => {
      res.render('completed_game', { gameInfo: JSON.stringify(data) })
    })
  }

})

app.post('/fetch-games', async (req, res) => {
  const db = await handleDatabase("Chess")
  const data = req.body;
  const page = data.page;
  let sessionId = req.session.sessionId;
  const user = await db.collection("session_tokens").findOne({ token: { session_id: sessionId, expired: false } });

  console.log("user", user)
  if (user) {
    const userid = user.userid;
    let userInfo = await db.collection("game_info").findOne({ userid: userid });
    userInfo = userInfo.info;

    const games = userInfo.games;

    const len = games.length
    let truncatedGames = [];


    for (let i = Math.max(0, len - 5 * page); i < len - 5 * (page - 1); i++) {
      truncatedGames.push(games[i])

    }


    res.send({ games: truncatedGames, gamesLength: userInfo.games.length, username: userInfo.username, title: userInfo.title })

  }
  else {
    res.redirect("/login")
  }
})


app.post("/fetch-dialy-puzzle", async (req, res) => {
  let data = await lichess.fetchDailyPuzzle();
  if (data.ok) {

    let puzzle = data.puzzle
    let pgn = puzzle.game.pgn;
    let g = chess.decodeFullPGNGame(pgn, 1)
    puzzle.game.game = g.game
    puzzle.game.resultFen = g.resultFen
    res.send({ ok: true, puzzle });
  }
  else {
    res.send({ ok: false })
  }

})


app.post('/logout-user', async (req, res) => {
  try {
    const db = await handleDatabase("Chess");
    const sessionId = req.session.sessionId;

    if (!sessionId) {
      return res.status(400).send({ ok: false, message: 'Session ID is required' });
    }

    const result = await db.collection('session_tokens').deleteOne({ "token.session_id": sessionId });

    if (result.deletedCount === 0) {
      return res.status(404).send({ ok: false, message: 'Session not found' });
    }

    res.send({ ok: true });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).send({ ok: false, message: 'Internal server error' });
  }
});
/**Main */

signupConnections.handleSignUp(app);
var onlineRequests = [];

io.of("/play").on("connection", (socket) => {


  socket.on("play-online-request", (data) => {
    if (onlineRequests.length == 0) {
      socket.userInfo = data
      onlineRequests.push(socket);
    }
    else if (onlineRequests[0].userInfo.userid === data.userid && false) {
      /**already searching a match */
      socket.emit('play-online-responce', { ok: false, errMessage: "Already searching an online match in another device or tab!" });
    }
    else {
      let url1 = "/play/online/" + helper_functions.generateURL(8);
      let url2 = "/play/online/" + helper_functions.generateURL(8);

      onlineRequests[0].emit("play-online-responce", { ok: true, url: url1 + "?userid=" + onlineRequests[0].userInfo.userid });
      socket.emit("play-online-responce", { ok: true, url: url2 + "?userid=" + data.userid });


      app.get(url1, (req, res) => {
        res.sendFile(
          path.join(__dirname, "/public/src/white.html")
        );
      });
      app.get(url2, (req, res) => {
        res.sendFile(
          path.join(__dirname, "/public/src/black.html")
        );
      });
      onlineRequests = [];
    }
    socket.on('cancel-online-request', data => {
      onlineRequests = onlineRequests.filter(element => element.userInfo.userid != data.userid);
      socket.emit('cancel-online-responce', { ok: true })
    })
    socket.on('disconnect', () => {
      onlineRequests = onlineRequests.filter(element => element.userInfo.userid != socket.userInfo.userid);
    })

  });



});

const online = io.of("/play/online");

playOnlineConnections.handlePlayOnlineConnections(online);
playMycomputerConnections.handlePlayMyComputerRequests(io, app);
stockfishConnections.handleStockfishConnections(io, app);

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
