// const { spawn } = require("child_process");
const helper_functions = require("./helper_functions");

function handleStockfishConnections(io, app) {
  var connected = [];
  io.of("/play").on("connection", (socket) => {
    socket.on("play-stockfish-request", (data) => {
      const url = helper_functions.generateURL(8);
      app.get("/play/stockfish/" + url, (req, res) => {
        res.sendFile(
          "C:/Users/shafa/Desktop/BIG_FOLDER/Chess Pro Test - 4/public/src/HTML_Files/stockfish.html"
        );
      });
      socket.emit("play-stockfish-responce", { url: "/play/stockfish/" + url });
    });
  });

  const stockfishNamespace = io.of("/play/stockfish");
  stockfishNamespace.on("connection", (socket) => {
    socket.on("fetch-data-request-stockfish", (data) => {
      let match = connected.find((obj) => obj.url == data.url);
      if (match) {
        socket.emit("fetch-data-responce-stockfish", match.game_details);
      } else {
        connected.push({ socket: socket, url: data.url });
        socket.emit("fetch-data-responce-stockfish", {});
      }
    });

    socket.on("save-board-data", (data) => {
      const requestData = JSON.parse(data);
      let match = connected.find((obj) => obj.url == requestData.url);
      if (match) {
        match.game_details = requestData;
      }
    });

    socket.on("fetch-move", (data) => {
      const fen = data.fen,
        depth = data.depth;
      stockfish_ouput(fen, depth)
        .then((data) => {
          socket.emit("fetch-move-responce", data);
        })
        .catch((err) => {
          console.log("error occured");
        });
    });
  });
}


module.exports = { handleStockfishConnections };
