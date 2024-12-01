// const db = require("./database/dbmethods");
const chess = require("./chess");
const helper_functions = require("./helper_functions");
const { handleDatabase } = require("./database");



async function handlePlayOnlineConnections(online, db) {


  var onlinePlayers = [];
  var roomCount = 1;

  online.on("connection", (socket) => {
    socket.on("ready", async (data) => {
      let match = onlinePlayers.find((obj) => obj.url == data.url);
      if (match) {
        retrieveSocketData(socket, match);
        socket.emit("ready-ok", {
          myInfo: socket.userInfo,
          opponentInfo: socket.oppositeSocket.userInfo,
        });
        socket.oppositeSocket.emit("ready-ok", null);
        if (socket.gameOver || socket.oppositeSocket.gameOver) {
          socket.emit("gameover", { ok: false });
        } else {
          updateTimer(socket, db);
        }
      } else if (onlinePlayers.length % 2 == 0) {
        socket.userid = data.userid;
        socket.url = data.url;
        onlinePlayers.push({
          socket: socket,
          url: data.url,
          userid: socket.userid,
        });
      } else {
        let roomName = `room${roomCount}`;
        socket.userid = data.userid;
        socket.url = data.url;
        onlinePlayers.push({
          socket: socket,
          url: data.url,
          userid: socket.userid,
        });
        let len = onlinePlayers.length;
        let socket1 = onlinePlayers[len - 2].socket;
        let socket2 = onlinePlayers[len - 1].socket;

        socket1.join(roomName);
        socket2.join(roomName);

        socket1.room = roomName;
        socket2.room = roomName;
        socket1.startTime = new Date().getTime();
        socket2.startTime = new Date().getTime();
        socket1.remainingTime = 60000;
        socket2.remainingTime = 60000;

        socket1.oppositeSocket = socket2;
        socket2.oppositeSocket = socket1;

        if (data.color == 1) {
          socket1.countDown = false;
          socket2.countDown = false;
          socket2.color = 1;
          socket1.color = -1;
          onlinePlayers[len - 1].game_details = {
            board: chess.startPos(1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [true, -1],
          };
          onlinePlayers[len - 2].game_details = {
            board: chess.startPos(-1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [true, -1],
          };
          onlinePlayers[len - 1].socket.game_details = {
            board: chess.startPos(1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [true, -1],
          };
          onlinePlayers[len - 2].socket.game_details = {
            board: chess.startPos(-1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [true, -1],
          };
        } else {
          socket1.countDown = false;
          socket2.countDown = false;
          socket1.color = 1;
          socket2.color = -1;
          onlinePlayers[len - 2].game_details = {
            board: chess.startPos(1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [false, -1],
          };
          onlinePlayers[len - 1].game_details = {
            board: chess.startPos(-1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [false, -1],
          };
          onlinePlayers[len - 2].socket.game_details = {
            board: chess.startPos(1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [false, -1],
          };
          onlinePlayers[len - 1].socket.game_details = {
            board: chess.startPos(-1),
            pgn: "",
            turn: 1,
            Moves: [],
            whiteCastle: [true, true],
            blackCastle: [true, true],
            enPassantForWhite: [false, -1],
            enPassantForBlack: [false, -1],
          };
        }

        roomCount++;

        const userInfo1 = await db.collection('game_info').findOne({
          userid: socket1.userid,
        });

        const userInfo2 = await db.collection("game_info").findOne({
          userid: socket2.userid,
        });
        socket1.userInfo = userInfo1.info;
        socket2.userInfo = userInfo2.info;

        socket1.gameOver = false;
        socket2.gameOver = false;

        socket1.emit("ready-ok", {
          myInfo: userInfo1.info,
          opponentInfo: userInfo2.info,
        });
        socket2.emit("ready-ok", {
          myInfo: userInfo2.info,
          opponentInfo: userInfo1.info,
        });

        updateTimer(socket1, db);
        updateTimer(socket2, db);
      }

      socket.on("PlayedMove", (data) => {
        if (socket.gameOver) {
          return;
        }

        const url = socket.url;
        const oppositeUrl = socket.oppositeSocket.url;
        let match = onlinePlayers.find((obj) => obj.url == url);
        let oppositeMatch = onlinePlayers.find((obj) => obj.url == oppositeUrl);
        let gameState = match.game_details;
        let oppositeGameState = oppositeMatch.game_details;
        const userid = match.userid;
        const opponentUserid = oppositeMatch.userid;
        if (gameState.turn == -socket.color) {
          /**cheating (against turn)*/
          console.log("Cheating against turn")
          return;
        }
        let legal = chess.isLegal(
          gameState.board,
          socket.color,
          socket.color,
          gameState.whiteCastle,
          gameState.blackCastle,
          gameState.enPassantForWhite,
          gameState.enPassantForBlack,
          data.move
        );
        if (legal.ok) {
          let transformedMove = chess.transformMove(data.move);
          socket.oppositeSocket.emit("Responce", transformedMove);
          if (socket.game_details.Moves.length) {
            socket.countDown = false;
            socket.oppositeSocket.countDown = true;
            socket.remainingTime += 2000;
          }
          match.game_details.Moves.push(data.move);
          match.game_details.pgn += legal.move + " "
          socket.game_details.Moves.push(data.move);
          socket.game_details.pgn += legal.move + " ";
          oppositeMatch.game_details.Moves.push(chess.transformMove(data.move));
          oppositeMatch.game_details.pgn += legal.move + " ";
          socket.oppositeSocket.game_details.Moves.push(
            chess.transformMove(data.move)
          );
          socket.oppositeSocket.game_details.pgn += legal.move + " "
          let result = chess.playMove(gameState.board, data.move, socket.color, socket.color, gameState.whiteCastle, gameState.blackCastle, gameState.enPassantForWhite, gameState.enPassantForBlack, true);
          chess.playMove(oppositeGameState.board, transformedMove, socket.color, -socket.color, oppositeGameState.whiteCastle, oppositeGameState.blackCastle, oppositeGameState.enPassantForWhite, oppositeGameState.enPassantForBlack);
          chess.playMove(socket.game_details.board, data.move, socket.color, socket.color, socket.game_details.whiteCastle, socket.game_details.blackCastle, socket.game_details.enPassantForWhite, socket.game_details.enPassantForBlack, true);
          chess.playMove(socket.oppositeSocket.game_details.board, transformedMove, socket.color, -socket.color, socket.oppositeSocket.game_details.whiteCastle, socket.oppositeSocket.game_details.blackCastle, socket.oppositeSocket.game_details.enPassantForWhite, socket.oppositeSocket.game_details.enPassantForBlack, true);
          match.game_details.turn = -socket.color;
          socket.game_details.turn = -socket.color;
          oppositeMatch.game_details.turn = -socket.color;
          socket.oppositeSocket.game_details.turn = -socket.color;

          if (result.gameOver) {

            if (result.result == "checkmate") {
              updateUserInfo(
                db,
                socket,
                userid,
                opponentUserid,
                gameState,
                oppositeGameState,
                socket.color,
                result.result
              );
            } else if (result.result == "stalemate") {
              updateUserInfo(
                db,
                socket,
                (socket.color == 1 ? userid : opponentUserid),
                (socket.color == 1 ? opponentUserid : userid),
                (socket.color == 1 ? gameState : oppositeGameState),
                (socket.color == 1 ? oppositeGameState : gameState),

                0,
                result.result
              );
            }
          }
        } else {
          console.log("Cheating by playing illegal Move")
          socket.emit("played-illegal-move", {
            move: data.move,
            cRights: chess.storeCastlingRights(
              gameState.whiteCastle,
              gameState.blackCastle
            ),
            eRights: chess.storeEnPassantRights(
              gameState.enPassantForWhite,
              gameState.enPassantForBlack
            ),
          });
        }
      });
      socket.on("fetch-data-request-online", (data) => {
        let match = onlinePlayers.find((obj) => obj.url == data.url);

        socket.emit("fetch-data-responce-online", match.game_details);
      });



      socket.on('resign', data => {
        const userid = socket.userid;
        const opponentUserid = socket.oppositeSocket.userid
        updateUserInfo(db, socket.oppositeSocket, opponentUserid, userid, socket.oppositeSocket.game_details, socket.game_details, -socket.color, "Resignation"
        );

      })

      socket.on('draw', data => {
        if (socket.game_details.Moves.length < 2) {
          return;
        }
        socket.offeredDraw = true;
        socket.oppositeSocket.emit("draw-offer");
        setTimeout(() => {

          socket.offeredDraw = false;
        }, 5000);
      })
      socket.on('draw-acknowledge', data => {
        if (socket.oppositeSocket.offeredDraw) {

          const userid = socket.userid;
          const opponentUserid = socket.oppositeSocket.userid
          updateUserInfo(db, (socket.color == 1 ? socket : socket.oppositeSocket), (socket.color == 1 ? userid : opponentUserid), (socket.color == 1 ? opponentUserid : userid), (socket.color == 1 ? socket.game_details : socket.oppositeSocket.game_details), (socket.color == 1 ? socket.oppositeSocket.game_details : socket.game_details), 0, "Mutual Settlement"
          );
        }
      })
      socket.on('draw-decline', data => {
        socket.oppositeSocket.offeredDraw = false;
      })

      socket.on("disconnect", () => {
        socket.disconnected = true;
        socket.emit('lost-connection');
        socket.oppositeSocket.emit("opponent-lost-connection");
      });

    });
  });
}

function retrieveSocketData(socket, match) {
  socket.join(match.socket.room);
  socket.room = match.socket.room;
  socket.color = match.socket.color;
  socket.url = match.socket.url;
  socket.gameOver = match.socket.gameOver;
  socket.game_details = match.socket.game_details;
  socket.userInfo = match.socket.userInfo;
  socket.userid = match.socket.userid;
  socket.countDown = match.socket.countDown;
  socket.oppositeSocket = match.socket.oppositeSocket;
  socket.oppositeSocket.oppositeSocket = socket;
  socket.remainingTime = match.socket.remainingTime;
  socket.startTime = match.socket.startTime;
  match.socket = socket;
}

async function updateUserInfo(db, socket, winnerId, loserId, winnerGameState, loseGameState, winner, reason) {

  socket.gameOver = true;
  socket.oppositeSocket.gameOver = true;
  let perspective = socket.color
  let winnerRatingChange, loserRatingChange;
  let winnerInfo = await db.collection('game_info').findOne({ userid: winnerId });
  let loserInfo = await db.collection("game_info").findOne({ userid: loserId });
  let simplifiedWinnerGame = "";
  for (move of winnerGameState.Moves) {
    let m = chess.simplifyMoveNotation(move, perspective);
    simplifiedWinnerGame += m + " ";
  }
  let simplifiedLoserGame = "";
  for (move of loseGameState.Moves) {
    let m = chess.simplifyMoveNotation(move, -perspective);
    simplifiedLoserGame += m + " ";
  }
  const date = helper_functions.getDate();
  const resultFen = chess.boardToFen(winnerGameState.board, perspective).split(" ")[0];
  const winnerGameId = helper_functions.generateCode(6)
  const loserGameId = helper_functions.generateCode(6)
  const newWinnerGame = (
    JSON.stringify({
      game: simplifiedWinnerGame, pgn: winnerGameState.pgn, gameId: winnerGameId, perspective: perspective, myId: winnerId, opponentId: loserId, winnerUsername: winnerInfo.info.username, loserUsername: loserInfo.info.username, winnerRating: winnerInfo.info.rating, loserRating: loserInfo.info.rating, winner: winner, date: date, reason: reason, resultFen
    })
  );
  const newLoserGame = (
    JSON.stringify({
      game: simplifiedLoserGame, pgn: loseGameState.pgn, gameId: loserGameId, perspective: -perspective, myId: loserId, opponentId: winnerId, winnerUsername: winnerInfo.info.username, loserUsername: loserInfo.info.username, winnerRating: winnerInfo.info.rating, loserRating: loserInfo.info.rating, winner: winner, date: date, reason: reason, resultFen
    })
  );

  if (winner) {
    // Constants
    const K_FACTOR1 = 200 / (1 + winnerInfo.info.total_games);
    const K_FACTOR2 = 200 / (1 + loserInfo.info.total_games);

    // Calculate expected scores
    const winnerExpectedScore = 1 / (1 + 10 ** ((loserInfo.info.rating - winnerInfo.info.rating) / 200));
    const loserExpectedScore = 1 - winnerExpectedScore;

    // Update ratings
    winnerRatingChange = Math.round(K_FACTOR1 * (1 - winnerExpectedScore));
    loserRatingChange = Math.round(K_FACTOR2 * (0 - loserExpectedScore));

    // Return updated user info

    const newWinnerRating = Math.max(250, winnerInfo.info.rating + winnerRatingChange);
    const newLoserRating = Math.max(250, loserInfo.info.rating + loserRatingChange);

    winnerInfo.rating = newWinnerRating;
    loserInfo.rating = newLoserRating;
    winnerInfo.info.games_won++;
    loserInfo.info.games_lost++;

    await db.collection("game_info").updateOne({ userid: winnerId }, { $set: { "info.rating": newWinnerRating } })
    await db.collection("game_info").updateOne({ userid: loserId }, { $set: { "info.rating": newLoserRating } })
    await db.collection("game_info").updateOne({ userid: winnerId }, { $set: { "info.total_games": winnerInfo.info.total_games } })
    await db.collection("game_info").updateOne({ userid: loserId }, { $set: { "info.total_games": loserInfo.info.total_games } })
  }

  winnerInfo.info.total_games++;
  loserInfo.info.total_games++;

  await db.collection("game_info").updateOne({ userid: winnerId }, { $push: { "info.games": newWinnerGame } })
  await db.collection("game_info").updateOne({ userid: loserId }, { $push: { "info.games": newLoserGame } })

  if (winner == 1) {
    winnerInfo.info.games_won_as_white++;
    await db.collection("game_info").updateOne({ userid: winnerId }, { $set: { "info.games_won_as_white": winnerInfo.info.games_won_as_white } })

  } else if (winner == -1) {
    winnerInfo.info.games_won_as_black++;
    await db.collection("game_info").updateOne({ userid: winnerId }, { $set: { "info.games_won_as_black": winnerInfo.info.games_won_as_black } })
  } else {
    winnerInfo.info.games_draw++;
    loserInfo.info.games_draw++;
    await db.collection("game_info").updateOne({ userid: winnerId }, { $set: { "info.games_draw": winnerInfo.info.games_draw } })
    await db.collection("game_info").updateOne({ userid: loserId }, { $set: { "info.games_draw": loserInfo.info.games_draw } })
  }

  winnerInfo.info.ratingChange = winnerRatingChange;
  loserInfo.info.ratingChange = loserRatingChange;
  socket.emit("gameover", {
    winner: winner,
    reason: reason,
    winnerInfo: winnerInfo.info,
    loserInfo: loserInfo.info,
  });
  socket.oppositeSocket.emit("gameover", {
    winner: winner,
    reason: reason,
    winnerInfo: winnerInfo.info,
    loserInfo: loserInfo.info,
  });
}

function updateTimer(socket, db) {
  if (socket.disconnected) {
    return;
  }

  if (socket.gameOver) {
    socket.oppositeSocket.gameOver = true;
    return;
  }

  if (socket.remainingTime <= 0) {
    socket.remainingTime = 0;

    updateUserInfo(db, socket.oppositeSocket, socket.oppositeSocket.userid, socket.userid, socket.oppositeSocket.game_details, socket.game_details, -socket.color, "Timeout")
    return;
  }

  if (socket.countDown) {
    socket.remainingTime =
      socket.remainingTime - (new Date().getTime() - socket.startTime);
  }

  socket.startTime = new Date().getTime();

  socket.emit("updateTimeResponce", {
    myTime: socket.remainingTime,
    oppositeTime: socket.oppositeSocket.remainingTime,
  });

  setTimeout(() => {
    updateTimer(socket, db);
  }, 50);
}
module.exports = { handlePlayOnlineConnections };


// })
