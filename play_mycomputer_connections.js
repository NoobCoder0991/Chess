const helper_functions = require("./helper_functions");
const chess = require("./chess");
const path = require('path')

function handlePlayMyComputerRequests(io, app) {
  var connected = [];
  io.of("/play").on("connection", (socket) => {
    socket.on("play-mycomputer-request", (data) => {
      const url = helper_functions.generateURL(8);
      app.get("/play/computer/" + url, (req, res) => {
        res.sendFile(
          path.join(__dirname, "/public/src/HTML_Files/engine.html")
        );
      });
      socket.emit("play-mycomputer-responce", {
        url: "/play/computer/" + url + "?perspective=" + data.perspective,
      });
    });
  });

  const computerNamespace = io.of("/play/computer");
  computerNamespace.on("connection", (socket) => {
    console.log("connected to computer namespace");
    socket.on("fetch-data-request", (data) => {
      let match = connected.find((obj) => obj.url == data.url);
      if (match) {
        socket.emit("fetch-data-responce", match.game_details);
      } else {
        connected.push({ socket: socket, url: data.url });
        socket.emit("fetch-data-responce", {});
      }
    });

    socket.on("save-board-data", (data) => {
      const requestData = JSON.parse(data);
      let match = connected.find((obj) => obj.url == requestData.url);
      if (match) {
        match.game_details = requestData;
      }
    });

    socket.on("new-game-request", (data) => {
      const url = helper_functions.generateURL(8);
      app.get("/play/computer/" + url, (req, res) => {
        res.sendFile(
          path.join(__dirname, "/public/src/HTML_Files/engine.html")
        );
      });
      socket.emit("new-game-responce", {
        url: "/play/computer/" + url + "?perspective=" + data.perspective,
      });
    });
  });
}

module.exports = { handlePlayMyComputerRequests };
