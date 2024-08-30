var socket = io("/play/online");
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

const userid = parseInt(params.get("userid"));
let ready = false;
var myInfo, opponentInfo;
socket.emit("ready", { url: window.location.href, color: -1, userid });
socket.on("ready-ok", (data) => {
  ready = true;
  if (data) {
    myInfo = data.myInfo;
    opponentInfo = data.opponentInfo;

    document.getElementsByClassName("profile-name")[0].innerHTML =
      data.opponentInfo.username;
    document.getElementsByClassName("profile-name")[1].innerHTML =
      data.myInfo.username;
    document.getElementsByClassName("profile-title")[0].innerHTML =
      data.opponentInfo.title;
    document.getElementsByClassName("profile-title")[1].innerHTML =
      data.myInfo.title;
    document.getElementsByClassName("profile-rating")[0].innerHTML =
      "(" + data.opponentInfo.rating + ")";
    document.getElementsByClassName("profile-rating")[1].innerHTML =
      "(" + data.myInfo.rating + ")";
    document.getElementsByTagName('title')[0].innerHTML = 'Play Online-' + myInfo.username

  }

  document.getElementsByClassName("reconnected")[0].style.display = "flex";
  document.getElementsByClassName("reconnecting")[0].style.display = "none";
  setTimeout(() => {
    document.getElementsByClassName("reconnected")[0].style.display = "none";
  }, 5000);
});

socket.on("Responce", (move) => {
  fastForward();
  MakeMove(board, move, true, false);
});

socket.on("played-illegal-move", (data) => {
  unMakeMove(data.move, true);
  unMove(board, data.move, data.cRights, data.eRights);
  changeTurn();
  Moves.pop();
  moveTypes.pop();
  pointer--;
  const lastMove = Moves[Moves.length - 1];
  unHightlight();
  if (lastMove) {
    highlightLastMove(lastMove.startSquare, lastMove.targetSquare);
  }
  displayCheatingWarning(myInfo.username);
});

socket.on("opponent-lost-connection", (data) => {
  document.getElementsByClassName("reconnecting")[0].style.display = "flex";
  document.getElementsByClassName("reconnected")[0].style.display = "none";
});
//

socket.on("updateTimeResponce", (data) => {
  updateTime(data.myTime, data.oppositeTime);
});
socket.on('draw-offer', data => {
  document.getElementsByClassName('opponent-draw')[0].style.display = 'flex'
  setTimeout(() => {

    document.getElementsByClassName('opponent-draw')[0].style.display = 'none'
  }, 5000);
})

var pieceLocations = [];

let moveSound = new Audio("../../assets/sound-files/lichess-move.ogg");
let captureSound = new Audio("../../assets/sound-files/lichess-capture.ogg");
let background = new Audio("../../assets/sound-files/background.mp3");
let castleSound = new Audio("../../assets/sound-files/castle.mp3");
let promotionSound = new Audio("../../assets/sound-files/promote.mp3");
let checkSound = new Audio("../../assets/sound-files/move-check.wav");
let gameEnd = new Audio("../../assets/sound-files/end.webm");
let gameStart = new Audio("../../assets/sound-files/gameStart-alt.mp3");

let chessboard = document.getElementById("chessBoard");

var perspective = -1;
var str;
if (perspective == 1) {
  str = "rnbqkbnrpppppppp8888PPPPPPPPRNBQKBNR";
} else {
  str = "RNBKQBNRPPPPPPPP8888pppppppprnbkqbnr";
}

var board = setUpBoard(str);
function setUpBoard(position) {
  board = generateBoard(position);
  putPieceOnBoard(board);

  return board;
}

let chessPieces = document.getElementsByClassName("piece");
let squares = document.getElementsByClassName("square");
createCirclesOnSquares();
var turn = 1;
var moveCount = 0;
var Moves = [];
var moveTypes = [];
var pointer = 0;
var activeMoves = [];
// //initial indices of kings
var indexOfWhiteKing = FindIndexOfWhiteKing(str);
var indexOfBlackKing = FindIndexOfBlackKing(str);

var gameOver = false;
//Generalized maps for the pieces

// //
socket.emit("fetch-data-request-online", { url: window.location.href });
socket.on("fetch-data-responce-online", (data) => {
  if (data && data.Moves.length) {
    let tempMoves = Object.values(data.Moves);

    for (let i = 0; i < tempMoves.length; i++) {
      MakeMove(board, tempMoves[i], true, false);
    }
  }
});
socket.on('draw-offer', data => {
  document.getElementsByClassName('opponent-draw')[0].style.display = 'flex'
  setTimeout(() => {

    document.getElementsByClassName('opponent-draw')[0].style.display = 'none'
  }, 3000);
})

let resignButton = document.getElementsByClassName("resign")[0];
let drawButton = document.getElementsByClassName("draw")[0];
let abortButton = document.getElementsByClassName("abort")[0];

resignButton.addEventListener("click", (e) => {
  if (resignButton.classList.contains("active-action")) {
    socket.emit('resign')
  } else {
    resignButton.classList.add("active-action");
    setTimeout(() => {
      resignButton.classList.remove("active-action");
    }, 2000);
  }
});
drawButton.addEventListener("click", (e) => {
  if (drawButton.classList.contains("active-action")) {
    socket.emit('draw');
    drawButton.classList.remove("active-action");
    drawButton.innerHTML = 'sent <i class="fas fa-check"></i>';
    setTimeout(() => {
      drawButton.innerHTML = `<div class="icon">&frac12</div>
                    <div>Draw</div>`;

    }, 5000);


  } else {
    let htm = drawButton.innerHTML
    drawButton.classList.add("active-action");
    drawButton.innerHTML = 'Really?'
    setTimeout(() => {
      drawButton.classList.remove("active-action");
      drawButton.innerHTML = htm
    }, 2000);
  }


});
abortButton.addEventListener("click", (e) => { });

let enPassantForWhite = [false, -1];
let enPassantForBlack = [false, -1];
let whiteCastle = [true, true];
let blackCastle = [true, true];

addMoveBehaviourToPieces();

function putPieceOnBoard(board) {
  //creating elements
  let count = 0;
  for (let i = 0; i < 64; i++) {
    if (board[i] == 0) {
      continue;
    }
    let piece = document.createElement("img");
    piece.classList.remove("blankImage");
    piece.classList.add("piece");
    piece.src = "../../assets/image-files/piece-images/" + board[i] + ".png";

    if (board[i] == 0) {
      piece.classList.add("blankImage");
    }
    let squares = document.getElementsByClassName("square");
    let rect1 = squares[0].getBoundingClientRect();
    let rect2 = squares[i].getBoundingClientRect();
    piece.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top
      }px)`;
    chessboard.appendChild(piece);
    pieceLocations.push({ domIndex: count, squareIndex: i });
    count++;
  }
}

function refreshWholeBoard() {
  let rect1 = squares[0].getBoundingClientRect();
  for (let i = 0; i < 32; i++) {
    let element = chessPieces[i];
    let squareIndex = pieceLocations.find(
      (obj) => obj.domIndex === i
    ).squareIndex;

    if (squareIndex >= 0 && squareIndex < 64) {
      let rect2 = squares[squareIndex].getBoundingClientRect();
      element.style.transform = `translate(${rect2.left - rect1.left}px, ${rect2.top - rect1.top
        }px)`;
    }
  }

  let highlightCircles = document.getElementsByClassName("highlight-circle");
  let rect0 = squares[0].getBoundingClientRect();
  let w = parseFloat(window.getComputedStyle(highlightCircles[0]).width);
  for (let i = 0; i < 64; i++) {
    let rect = squares[i].getBoundingClientRect();
    highlightCircles[i].style.transform = `translate(${rect.left + rect.width / 2 - w / 2 - rect0.left
      }px, ${rect.top + rect.height / 2 - w / 2 - rect0.top}px)`;
  }
}

window.addEventListener("resize", (e) => {
  e.preventDefault();
  refreshWholeBoard();
});

// //to highlight moves i put small circles on each square
function createCirclesOnSquares() {
  for (let i = 0; i < 64; i++) {
    let rect = squares[i].getBoundingClientRect();
    let rect0 = squares[0].getBoundingClientRect();
    let circle = document.createElement("div");
    circle.classList.add("highlight-circle");
    chessboard.appendChild(circle);

    let w = parseFloat(window.getComputedStyle(circle).width);
    circle.style.transform = `translate(${rect.left + rect.width / 2 - w / 2 - rect0.left
      }px, ${rect.top + rect.height / 2 - w / 2 - rect0.top}px)`;
  }
}

function coordinatesToIndex(arr) {
  return arr[0] + 8 * arr[1];
}

function isOutsideBoard(coordinates) {
  if (
    coordinates[0] < 0 ||
    coordinates[0] >= 8 ||
    coordinates[1] < 0 ||
    coordinates[1] >= 8
  ) {
    return true;
  } else {
    return false;
  }
}

//remove function
function removeOptions() {
  let options = document.getElementsByClassName("options");
  let len = options.length;

  for (let i = 0; i < len; i++) {
    options[0].style.display = "none";
  }
}

function generateBoard(str) {
  let board = [];
  let map = {
    R: 6,
    N: 3,
    B: 4,
    Q: 10,
    K: 2,
    P: 1,
    r: -6,
    n: -3,
    b: -4,
    q: -10,
    k: -2,
    p: -1,
  };
  for (char of str) {
    if (map.hasOwnProperty(char)) {
      board.push(map[char]);
    } else {
      let num = parseInt(char);

      for (j = 0; j < num; j++) {
        board.push(0);
      }
    }
  }

  return board;
}

function checkForCastlingRights(initial, final) {
  if (initial == 59) {
    perspective == 1
      ? (whiteCastle = [false, false])
      : (blackCastle = [false, false]);
  }
  if (initial == 3) {
    perspective == 1
      ? (blackCastle = [false, false])
      : (whiteCastle = [false, false]);
  }
  if (initial == 63 || final == 63) {
    perspective == 1 ? (whiteCastle[0] = false) : (blackCastle[0] = false);
  }
  if (initial == 56 || final == 56) {
    perspective == 1 ? (whiteCastle[1] = false) : (blackCastle[1] = false);
  }
  if (initial == 0 || final == 0) {
    perspective == 1 ? (blackCastle[1] = false) : (whiteCastle[1] = false);
  }
  if (initial == 7 || final == 7) {
    perspective == 1 ? (blackCastle[0] = false) : (whiteCastle[0] = false);
  }
}

//checking for en passant rights

function checkForEnPassantRights(board, initial, final, color) {
  let y1 = Math.floor(initial / 8);
  let y2 = Math.floor(final / 8);

  if (
    board[final] == perspective &&
    y1 == 6 &&
    y2 == 4 &&
    color == perspective
  ) {
    if (perspective == 1) {
      enPassantForWhite = [false, -1];
      enPassantForBlack = [true, final];
    } else {
      enPassantForWhite = [true, final];
      enPassantForBlack = [false, -1];
    }
  } else if (
    board[final] == -perspective &&
    y1 == 1 &&
    y2 == 3 &&
    color == -perspective
  ) {
    if (perspective == 1) {
      enPassantForBlack = [false, -1];
      enPassantForWhite = [true, final];
    } else {
      enPassantForBlack = [true, final];
      enPassantForWhite = [false, -1];
    }
  } else {
    enPassantForBlack = [false, -1];
    enPassantForWhite = [false, -1];
  }
}

// //storing castling rights
function storeCastlingRights() {
  let rights1 = [...whiteCastle];
  let rights2 = [...blackCastle];
  return [rights1, rights2];
}

function storeEnPassantRights() {
  let b1 = [...enPassantForWhite];
  let b2 = [...enPassantForBlack];
  return [b1, b2];
}

// //function for finding the positions of kings
function updateIndicesOfKings(initial, final) {
  if (initial == indexOfWhiteKing) {
    indexOfWhiteKing = final;
  } else if (initial == indexOfBlackKing) {
    indexOfBlackKing = final;
  }
}

function FindIndexOfWhiteKing(str) {
  let white = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] == "K") {
      return white;
    } else if (parseInt(str[i]) > 0) {
      white += parseInt(str[i]);
    } else {
      white++;
    }
  }
}
function FindIndexOfBlackKing(str) {
  let black = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] == "k") {
      return black;
    } else if (parseInt(str[i]) > 0) {
      black += parseInt(str[i]);
    } else {
      black++;
    }
  }
}
function NameMove(move, startPiece, check) {
  let name;
  if (move.isCastle) {
    if (perspective == 1) {
      switch (move.castleStart) {
        case 63:
          name = "O-O";
          break;
        case 56:
          name = "O-O-O";
          break;
        case 7:
          name = "o-o";
          break;
        case 0:
          name = "o-o-o";
          break;
      }
    } else {
      switch (move.castleStart) {
        case 63:
          name = "o-o-o";
          break;
        case 56:
          name = "o-o";
          break;
        case 7:
          name = "O-O-O";
          break;
        case 0:
          name = "O-O";
          break;
      }
    }
  } else if (move.isPromotion) {
    if (move.capturePiece) {
      name =
        File(move.startSquare) +
        "x" +
        NameSquare(move.targetSquare) +
        "=" +
        pieceName(move.promotionPiece);
    } else {
      name =
        NameSquare(move.targetSquare) +
        "=" +
        pieceName(move.promotionPiece).toUpperCase();
    }
  } else if (move.isEnPassant) {
    name =
      File(move.startSquare) + "x" + NameSquare(move.enPassantSquare) + " e.p.";
  } else if (move.capturePiece) {
    if (Math.abs(startPiece) == 1) {
      name = File(move.startSquare) + "x" + NameSquare(move.targetSquare);
    } else {
      name =
        pieceName(startPiece).toUpperCase() +
        "x" +
        NameSquare(move.targetSquare);
    }
  } else {
    name = pieceName(startPiece).toUpperCase() + NameSquare(move.targetSquare);
  }

  if (check) {
    name += "+";
  }
  return name;
}

function pieceName(piece) {
  switch (piece) {
    case 10:
      return "Q";
    case 6:
      return "R";
    case 3:
      return "N";
    case 4:
      return "B";
    case 2:
      return "K";
    case 1:
      return "";
    case -10:
      return "q";
    case -6:
      return "r";
    case -3:
      return "n";
    case -4:
      return "b";
    case -2:
      return "k";
    case -1:
      return "";
  }
}
function Rank(index) {
  let y = Math.floor(index / 8);
  return perspective == 1 ? 8 - y : y + 1;
}

function File(index) {
  let str = "abcdefgh";
  let x = index % 8;

  return perspective == 1 ? str[x] : str[7 - x];
}

function NameSquare(index) {
  let rank = Rank(index);
  let file = File(index);
  return file + rank.toString();
}

function highlight(moves, index) {
  document
    .getElementsByClassName("square")
  [index].classList.add("click-square");
  for (let move of moves) {
    document.getElementsByClassName("highlight-circle")[move].style.display =
      "flex";
  }
}

function unHightlight() {
  let clickSquare = document.getElementsByClassName("click-square");
  if (clickSquare.length) {
    clickSquare[0].classList.remove("click-square");
  }

  let circles = document.getElementsByClassName("highlight-circle");
  for (let i = 0; i < circles.length; i++) {
    circles[i].style.display = "none";
  }

  let squares = document.getElementsByClassName("square");

  for (let i = 0; i < 64; i++) {
    squares[i].classList.remove("odd-colored-square");
    squares[i].classList.remove("even-colored-square");
  }
}

function highlightLastMove(initial, final) {
  let prev1 = document.getElementsByClassName("start-square");
  let prev2 = document.getElementsByClassName("target-square");
  if (prev1.length && prev2.length) {
    prev1[0].classList.remove("start-square");
    prev2[0].classList.remove("target-square");
  }

  let checkSquare = document.getElementsByClassName("check-square");
  if (checkSquare.length) {
    checkSquare[0].classList.remove("check-square");
  }

  document
    .getElementsByClassName("square")
  [initial].classList.add("start-square");
  document
    .getElementsByClassName("square")
  [final].classList.add("target-square");
}
function checkKingIndex(color) {
  if (color == 1) {
    document
      .getElementsByClassName("square")
    [indexOfWhiteKing].classList.add("check-square");
  } else {
    document
      .getElementsByClassName("square")
    [indexOfBlackKing].classList.add("check-square");
  }
}
// //adding drag and drop behaviour
let draggedElementIndex = null;

function addDragAndDropBehaviour(index, color) {
  let element = chessPieces[index];

  element.addEventListener("dragstart", (e) => {
    let i = pieceLocations.find((obj) => obj.domIndex === index).squareIndex;
    let moves = finalLegalMoves(board, i, turn);
    highlight(
      moves.map((obj) => obj["targetSquare"]),
      i
    );
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ squareIndex: i, pieceIndex: index, moves })
    );
    element.style.opacity = "0.1";
  });

  element.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  element.addEventListener("drop", (e) => {
    let data = JSON.parse(e.dataTransfer.getData("text/plain"));
    chessPieces[data.pieceIndex].style.opacity = "1";
    let target = pieceLocations.find(
      (obj) => obj.domIndex === index
    ).squareIndex;

    let playedMove = data.moves.find((obj) => obj.targetSquare == target);
    if (playedMove) {
      MakeMove(board, playedMove, false, true);

      document.getElementsByTagName("title")[0].innerHTML = "Computer playing";
    } else {
      unHightlight();
    }
  });
}

function addClickBehaviour(index, turn) {
  let element = chessPieces[index];
  element.addEventListener("click", (e) => {
    if (!activeMoves.length) {
      let i = pieceLocations.find((obj) => obj.domIndex === index).squareIndex;
      activeMoves = finalLegalMoves(board, i, turn);
      highlight(
        activeMoves.map((obj) => obj["targetSquare"]),
        i
      );
    } else {
      let target = pieceLocations.find(
        (obj) => obj.domIndex === index
      ).squareIndex;
      let playedMove = activeMoves.find((obj) => obj.targetSquare == target);
      if (playedMove) {
        MakeMove(board, playedMove, true, true);
        document.getElementsByTagName("title")[0].innerHTML =
          "Computer playing";
      } else {
        unHightlight();
      }
      activeMoves = [];
    }
  });
}

function changeTurn() {
  if (turn == 1) turn = -1;
  else turn = 1;
}

function attackedSquares(board, color) {
  let arr = [];
  for (let i = 0; i < 64; i++) {
    if (board[i] * color > 0) {
      let legal = legalMoves(board, i, color);
      legal.forEach((move) => {
        if (!arr.includes(move.targetSquare)) {
          arr.push(move.targetSquare);
        }
      });
      if (board[i] * color == 1) {
        if (color == 1 && board[i - 7] == 0) arr.push(i - 7);
        if (color == 1 && board[i - 9] == 0) arr.push(i - 9);
        if (color == -1 && board[i + 7] == 0) arr.push(i + 7);
        if (color == -1 && board[i + 9] == 0) arr.push(i + 9);
      }
    }
  }
  return arr;
}

function legalMoves(board, index, turn) {
  let color, piece;
  if (board[index] > 0) {
    color = 1;
    piece = board[index];
  } else if (board[index] < 0) {
    color = -1;
    piece = -board[index];
  }
  if (board[index] == 0 || turn != color) {
    return [];
  }
  let legalmoves = [];
  let x = index % 8;
  let y = Math.floor(index / 8);
  if (piece == 6) {
    let top = [x, y - 1],
      left = [x - 1, y],
      bottom = [x, y + 1],
      right = [x + 1, y];

    while (!isOutsideBoard(top)) {
      if (board[coordinatesToIndex(top)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(top),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(top)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(top),
          capturePiece: board[coordinatesToIndex(top)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }

      top[1] -= 1;
    }
    while (!isOutsideBoard(left)) {
      if (board[coordinatesToIndex(left)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(left),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(left)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(left),
          capturePiece: board[coordinatesToIndex(left)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      left[0] -= 1;
    }
    while (!isOutsideBoard(bottom)) {
      if (board[coordinatesToIndex(bottom)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottom),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(bottom)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottom),
          capturePiece: board[coordinatesToIndex(bottom)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }

      bottom[1] += 1;
    }
    while (!isOutsideBoard(right)) {
      if (board[coordinatesToIndex(right)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(right),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(right)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(right),
          capturePiece: board[coordinatesToIndex(right)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      right[0] += 1;
    }
  }

  //knight
  else if (piece == 3) {
    let coordinates = [
      [x + 2, y + 1],
      [x + 2, y - 1],
      [x - 2, y + 1],
      [x - 2, y - 1],
      [x + 1, y + 2],
      [x - 1, y + 2],
      [x - 1, y - 2],
      [x + 1, y - 2],
    ];
    let allowedPositions = [];

    coordinates.forEach((coordinate) => {
      if (!isOutsideBoard(coordinate)) {
        allowedPositions.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(coordinate),
          capturePiece: board[coordinatesToIndex(coordinate)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      }
    });

    allowedPositions.forEach((position) => {
      if (board[position.targetSquare] * color <= 0) {
        legalmoves.push(position);
      }
    });
  }

  //finding  legal moves of bishop
  else if (piece == 4) {
    let topRight = [x + 1, y - 1],
      topLeft = [x - 1, y - 1],
      bottomRight = [x + 1, y + 1],
      bottomLeft = [x - 1, y + 1];

    while (!isOutsideBoard(topRight)) {
      if (board[coordinatesToIndex(topRight)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topRight),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(topRight)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topRight),
          capturePiece: board[coordinatesToIndex(topRight)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      topRight[0] += 1;
      topRight[1] -= 1;
    }
    while (!isOutsideBoard(topLeft)) {
      if (board[coordinatesToIndex(topLeft)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topLeft),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(topLeft)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topLeft),
          capturePiece: board[coordinatesToIndex(topLeft)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      topLeft[0] -= 1;
      topLeft[1] -= 1;
    }
    while (!isOutsideBoard(bottomRight)) {
      if (board[coordinatesToIndex(bottomRight)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomRight),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(bottomRight)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomRight),
          capturePiece: board[coordinatesToIndex(bottomRight)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      bottomRight[0] += 1;
      bottomRight[1] += 1;
    }
    while (!isOutsideBoard(bottomLeft)) {
      if (board[coordinatesToIndex(bottomLeft)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomLeft),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(bottomLeft)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomLeft),
          capturePiece: board[coordinatesToIndex(bottomLeft)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      bottomLeft[0] -= 1;
      bottomLeft[1] += 1;
    }
  }
  //end

  //legal moves for queen ( rook + bishop)
  else if (piece == 10) {
    let top = [x, y - 1],
      left = [x - 1, y],
      bottom = [x, y + 1],
      right = [x + 1, y];

    while (!isOutsideBoard(top)) {
      if (board[coordinatesToIndex(top)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(top),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(top)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(top),
          capturePiece: board[coordinatesToIndex(top)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }

      top[1] -= 1;
    }
    while (!isOutsideBoard(left)) {
      if (board[coordinatesToIndex(left)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(left),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(left)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(left),
          capturePiece: board[coordinatesToIndex(left)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      left[0] -= 1;
    }
    while (!isOutsideBoard(bottom)) {
      if (board[coordinatesToIndex(bottom)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottom),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(bottom)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottom),
          capturePiece: board[coordinatesToIndex(bottom)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }

      bottom[1] += 1;
    }
    while (!isOutsideBoard(right)) {
      if (board[coordinatesToIndex(right)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(right),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(right)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(right),
          capturePiece: board[coordinatesToIndex(right)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      right[0] += 1;
    }

    //bishop role
    let topRight = [x + 1, y - 1],
      topLeft = [x - 1, y - 1],
      bottomRight = [x + 1, y + 1],
      bottomLeft = [x - 1, y + 1];

    while (!isOutsideBoard(topRight)) {
      if (board[coordinatesToIndex(topRight)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topRight),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(topRight)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topRight),
          capturePiece: board[coordinatesToIndex(topRight)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      topRight[0] += 1;
      topRight[1] -= 1;
    }
    while (!isOutsideBoard(topLeft)) {
      if (board[coordinatesToIndex(topLeft)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topLeft),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(topLeft)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(topLeft),
          capturePiece: board[coordinatesToIndex(topLeft)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      topLeft[0] -= 1;
      topLeft[1] -= 1;
    }
    while (!isOutsideBoard(bottomRight)) {
      if (board[coordinatesToIndex(bottomRight)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomRight),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(bottomRight)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomRight),
          capturePiece: board[coordinatesToIndex(bottomRight)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      bottomRight[0] += 1;
      bottomRight[1] += 1;
    }
    while (!isOutsideBoard(bottomLeft)) {
      if (board[coordinatesToIndex(bottomLeft)] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomLeft),
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[coordinatesToIndex(bottomLeft)] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: coordinatesToIndex(bottomLeft),
          capturePiece: board[coordinatesToIndex(bottomLeft)],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }
      bottomLeft[0] -= 1;
      bottomLeft[1] += 1;
    }
  }

  //legal moves for king
  else if (piece == 2) {
    let coordinates = [
      [x, y + 1],
      [x, y - 1],
      [x + 1, y],
      [x - 1, y],
      [x + 1, y - 1],
      [x - 1, y - 1],
      [x - 1, y + 1],
      [x + 1, y + 1],
    ];
    coordinates.forEach((coordinate) => {
      if (!isOutsideBoard(coordinate)) {
        let a = board[coordinatesToIndex(coordinate)] * color;
        if (a <= 0) {
          legalmoves.push({
            startSquare: index,
            targetSquare: coordinatesToIndex(coordinate),
            capturePiece: board[coordinatesToIndex(coordinate)],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
    });
  }

  // legal moves for pawn
  else if (piece == 1) {
    if (color * perspective == 1) {
      if (Math.floor(index / 8) == 6) {
        if (board[index - 8] == 0 && board[index - 16] == 0) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 16,
            capturePiece: board[index - 16],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
      if (!isOutsideBoard([x, y - 1]) && board[index - 8] == 0) {
        if (Math.floor(index / 8) == 1) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 10 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 6 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 4 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 3 * perspective,
            isEnPassant: false,
          });
        } else {
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
      if (
        !isOutsideBoard([x + 1, y - 1]) &&
        board[index - 7] * perspective < 0
      ) {
        if (Math.floor(index / 8) == 1) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 10 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 6 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 4 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 3 * perspective,
            isEnPassant: false,
          });
        } else {
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
      if (
        !isOutsideBoard([x - 1, y - 1]) &&
        board[index - 9] * perspective < 0
      ) {
        if (Math.floor(index / 8) == 1) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 10 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 6 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 4 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 3 * perspective,
            isEnPassant: false,
          });
        } else {
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
    } else {
      //for black pawns
      if (Math.floor(index / 8) == 1) {
        if (board[index + 8] == 0 && board[index + 16] == 0) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 16,
            capturePiece: board[index + 16],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }

      if (!isOutsideBoard([x, y + 1]) && board[index + 8] == 0) {
        if (Math.floor(index / 8) == 6) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -10 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -6 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -4 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -3 * perspective,
            isEnPassant: false,
          });
        } else {
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
      if (
        !isOutsideBoard([x + 1, y + 1]) &&
        board[index + 9] * perspective > 0
      ) {
        if (Math.floor(index / 8) == 6) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            isCastle: false,
            capturePiece: board[index + 9],
            isPromotion: true,
            promotionPiece: -10 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            isCastle: false,
            capturePiece: board[index + 9],
            isPromotion: true,
            promotionPiece: -6 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            isCastle: false,
            capturePiece: board[index + 9],
            isPromotion: true,
            promotionPiece: -4 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            isCastle: false,
            capturePiece: board[index + 9],
            isPromotion: true,
            promotionPiece: -3 * perspective,
            isEnPassant: false,
          });
        } else {
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            capturePiece: board[index + 9],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
      if (
        !isOutsideBoard([x - 1, y + 1]) &&
        board[index + 7] * perspective > 0
      ) {
        if (Math.floor(index / 8) == 6) {
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -10 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -6 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -4 * perspective,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -3 * perspective,
            isEnPassant: false,
          });
        } else {
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: false,
            isEnPassant: false,
          });
        }
      }
    }
  }
  return legalmoves;
}
// //end of the legal moves function
function isUnderCheck(board, color) {
  var indexOfKing = positionOfKing(color);
  for (let i = 0; i < board.length; i++) {
    if (board[i] * color < 0) {
      if (
        legalMoves(board, i, -color).some(
          (obj) => obj.targetSquare === indexOfKing
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

// //legal moves along with check checking
function finalLegalMoves(board, index, color) {
  let legalmoves = legalMoves(board, index, color);
  let newLegalMoves = [];
  let attacked = attackedSquares(board, -color);
  //special moves
  let check = isUnderCheck(board, color);

  //Castling
  if (!check) {
    if (index == 59 && board[index] * perspective == 2) {
      //it may have right to castle
      let shortCastle = perspective == 1 ? whiteCastle[0] : blackCastle[0];
      let longCastle = perspective == 1 ? whiteCastle[1] : blackCastle[1];

      if (
        shortCastle &&
        board[60] == 0 &&
        board[61] == 0 &&
        board[62] == 0 &&
        !attacked.includes(61)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 61,
          capturePiece: 0,
          isCastle: true,
          castleStart: 63,
          castleEnd: 60,
          isPromotion: false,
          isEnPassant: false,
        });
      }
      if (
        longCastle &&
        board[58] == 0 &&
        board[57] == 0 &&
        !attacked.includes(59)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 57,
          capturePiece: 0,
          isCastle: true,
          castleStart: 56,
          castleEnd: 58,
          isPromotion: false,
          isEnPassant: false,
        });
      }
    }
    if (index == 3 && board[index] * perspective == -2) {
      let shortCastle = perspective == 1 ? blackCastle[0] : whiteCastle[0];
      let longCastle = perspective == 1 ? blackCastle[1] : whiteCastle[1];
      if (
        shortCastle &&
        board[4] == 0 &&
        board[5] == 0 &&
        board[6] == 0 &&
        !attacked.includes(5)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 5,
          capturePiece: 0,
          isCastle: true,
          castleStart: 7,
          castleEnd: 4,
          isPromotion: false,
          isEnPassant: false,
        });
      }
      if (
        longCastle &&
        board[2] == 0 &&
        board[1] == 0 &&
        !attacked.includes(3)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 1,
          capturePiece: 0,
          isCastle: true,
          castleStart: 0,
          castleEnd: 2,
          isPromotion: false,
          isEnPassant: false,
        });
      }
    }
  }

  //en passant
  if (color == 1 && enPassantForWhite[0] == true) {
    let position = enPassantForWhite[1];
    if (
      Math.abs(index - position) == 1 &&
      board[index] == 1 &&
      Math.floor(index / 8) == Math.floor(position / 8)
    ) {
      legalmoves.push({
        startSquare: index,
        targetSquare: position - 8 * perspective,
        capturePiece: 0,
        isCastle: false,
        isPromotion: false,
        isEnPassant: true,
        enPassantSquare: position,
      });
    }
  }
  if (color == -1 && enPassantForBlack[0] == true) {
    let position = enPassantForBlack[1];
    if (
      Math.abs(index - position) == 1 &&
      board[index] == -1 &&
      Math.floor(index / 8) == Math.floor(position / 8)
    ) {
      legalmoves.push({
        startSquare: index,
        targetSquare: position + 8 * perspective,
        capturePiece: 0,
        isCastle: false,
        isPromotion: false,
        isEnPassant: true,
        enPassantSquare: position,
      });
    }
  }

  if (!check) {
    legalmoves.forEach((move) => {
      let temp = board[move.targetSquare];
      let temp2 = board[move.startSquare];
      let c = storeCastlingRights();
      let e = storeEnPassantRights();
      playMove(board, move);

      if (isUnderCheck(board, color)) {
        unMove(board, move, c, e);
      } else {
        newLegalMoves.push(move);
        unMove(board, move, c, e);
      }
    });
    // newLegalMoves = legalmoves;
  } else {
    legalmoves.forEach((move) => {
      let temp = board[move.targetSquare];
      let temp2 = board[move.startSquare];
      let c = storeCastlingRights();
      let e = storeEnPassantRights();
      playMove(board, move);
      if (!isUnderCheck(board, color)) {
        newLegalMoves.push(move);
        unMove(board, move, c, e);
      } else {
        unMove(board, move, c, e);
      }
    });
  }

  return newLegalMoves;
}

function refreshBoard(move, smooth, type) {
  let rect1 = squares[0].getBoundingClientRect();
  let rect2 = squares[move.targetSquare].getBoundingClientRect();
  let pieceIndex = pieceLocations.find(
    (obj) => obj.squareIndex === move.startSquare
  ).domIndex;
  let pieceIndex2 = pieceLocations.find(
    (obj) => obj.squareIndex === move.targetSquare
  );
  if (smooth) {
    chessPieces[pieceIndex].classList.add("smooth-piece");
  }
  setTimeout(() => {
    chessPieces[pieceIndex].classList.remove("smooth-piece");
  }, 300);

  chessPieces[pieceIndex].style.transform = `translate(${rect2.left - rect1.left
    }px, ${rect2.top - rect1.top}px)`;
  if (move.capturePiece) {
    let elementIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.targetSquare
    );
    chessPieces[elementIndex.domIndex].style.display = "none";
    elementIndex.squareIndex = generateUniqueNumber(
      move.targetSquare,
      move.capturePiece
    );
  }
  if (move.isCastle) {
    let castlePieceIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.castleStart
    ).domIndex;
    chessPieces[castlePieceIndex].classList.add("smooth-piece");
    setTimeout(() => {
      chessPieces[castlePieceIndex].classList.remove("smooth-piece");
    }, 300);
    chessPieces[castlePieceIndex].style.transform = `translate(${squares[move.castleEnd].getBoundingClientRect().left - rect1.left
      }px, ${squares[move.castleEnd].getBoundingClientRect().top - rect1.top}px)`;
    let elementIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.castleStart
    );
    elementIndex.squareIndex = move.castleEnd;
  } else if (move.isPromotion) {
    chessPieces[pieceIndex].src =
      "../../assets/image-files/piece-images/" +
      board[move.targetSquare] +
      ".png";
  } else if (move.isEnPassant) {
    let enPassantPiece = pieceLocations.find(
      (obj) => obj.squareIndex == move.enPassantSquare
    );

    chessPieces[enPassantPiece.domIndex].style.display = "none";

    enPassantPiece.squareIndex = generateUniqueNumber(
      move.enPassantSquare,
      -board[move.targetSquare]
    );
  }

  pieceLocations.find(
    (obj) => obj.squareIndex === move.startSquare
  ).squareIndex = move.targetSquare;
  highlightLastMove(move.startSquare, move.targetSquare);
  playSoundEffects(type);
  document
    .getElementsByClassName("action")[1]
    .classList.remove("disabled-recapeButton");
  document
    .getElementsByClassName("action")[2]
    .classList.remove("disabled-recapeButton");
  let active = document.getElementsByClassName("active-move");
  if (active.length) {
    let pcActiveMove = active[1];
    document.getElementsByClassName("analysis-board")[0].scrollTop =
      pcActiveMove.offsetTop;
  }
}
//sound effects
function playSoundEffects(type) {
  switch (type) {
    case "check":
      checkSound.play();
      break;
    case "castle":
      castleSound.play();
      break;
    case "promotion":
      promotionSound.play();
      break;
    case "capture":
      captureSound.play();
      break;
    case "move":
      moveSound.play();
      break;

    default:
      moveSound.play();
  }
}

// //function to find the index of the king of the given color
function positionOfKing(color) {
  if (color == 1) {
    return indexOfWhiteKing;
  } else if (color == -1) {
    return indexOfBlackKing;
  }
}

// //function to return the number of pieces of a particular color
function totalPieces(board, color) {
  let count = 0;
  board.forEach((element) => {
    if (element * color > 0) count++;
  });
  return count;
}
function material(board, color) {
  let pieceMaterial = 0;

  for (let i = 0; i < 64; i++) {
    if (board[i] * color > 0) {
      pieceMaterial += board[i] * color;
      if (Math.abs(board[i]) == 4) pieceMaterial -= 0.8;
    }
  }
  return pieceMaterial;
}

function allLegalMoves(board, color) {
  let data = [];

  for (let i = 0; i < 64; i++) {
    if (board[i] * color > 0) {
      data = data.concat(finalLegalMoves(board, i, color));
    }
  }
  return data;
}

function playMove(board, move) {
  if (move.isCastle) {
    board[move.targetSquare] = board[move.startSquare];
    board[move.startSquare] = 0;
    board[move.castleEnd] = board[move.castleStart];
    board[move.castleStart] = 0;
  } else if (move.isPromotion) {
    board[move.targetSquare] = move.promotionPiece;
    board[move.startSquare] = 0;
  } else if (move.isEnPassant) {
    board[move.targetSquare] = board[move.startSquare];
    board[move.startSquare] = 0;
    board[move.enPassantSquare] = 0;
  } else {
    board[move.targetSquare] = board[move.startSquare];
    board[move.startSquare] = 0;
  }

  checkForCastlingRights(move.startSquare, move.targetSquare, turn);
  checkForEnPassantRights(board, move.startSquare, move.targetSquare, turn);
  updateIndicesOfKings(move.startSquare, move.targetSquare);
  return;
}

function unMove(board, move, cRights, eRights) {
  if (move.isCastle) {
    board[move.startSquare] = board[move.targetSquare];
    board[move.targetSquare] = 0;

    board[move.castleStart] = board[move.castleEnd];
    board[move.castleEnd] = 0;
  } else if (move.isPromotion) {
    board[move.targetSquare] = move.capturePiece;
    if (Math.floor(move.startSquare / 8) == 1) {
      board[move.startSquare] = perspective;
    } else {
      board[move.startSquare] = -perspective;
    }
  } else if (move.isEnPassant) {
    board[move.startSquare] = board[move.targetSquare];
    board[move.targetSquare] = 0;
    board[move.enPassantSquare] = -board[move.startSquare];
  } else {
    board[move.startSquare] = board[move.targetSquare];
    board[move.targetSquare] = move.capturePiece;
  }
  whiteCastle[0] = cRights[0][0];
  whiteCastle[1] = cRights[0][1];
  blackCastle[0] = cRights[1][0];
  blackCastle[1] = cRights[1][1];

  enPassantForWhite = eRights[0];
  enPassantForBlack = eRights[1];

  updateIndicesOfKings(move.targetSquare, move.startSquare);
}
function unMakeMove(move, smooth, type) {
  let rect1 = squares[0].getBoundingClientRect();
  let rect2 = squares[move.startSquare].getBoundingClientRect();
  let pieceIndex = pieceLocations.find(
    (obj) => obj.squareIndex === move.targetSquare
  ).domIndex;
  let pieceIndex2 = pieceLocations.find(
    (obj) => obj.squareIndex === move.startSquare
  );

  setTimeout(() => {
    chessPieces[pieceIndex].classList.remove("smooth-piece");
  }, 300);

  chessPieces[pieceIndex].style.transform = `translate(${rect2.left - rect1.left
    }px, ${rect2.top - rect1.top}px)`;

  if (smooth) {
    chessPieces[pieceIndex].classList.add("smooth-piece");
  }
  if (move.isCastle) {
    pieceLocations.find(
      (obj) => obj.squareIndex === move.targetSquare
    ).squareIndex = move.startSquare;
    let castlePieceIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.castleEnd
    ).domIndex;
    chessPieces[castlePieceIndex].classList.add("smooth-piece");
    setTimeout(() => {
      chessPieces[castlePieceIndex].classList.remove("smooth-piece");
    }, 300);
    chessPieces[castlePieceIndex].style.transform = `translate(${squares[move.castleStart].getBoundingClientRect().left - rect1.left
      }px, ${squares[move.castleStart].getBoundingClientRect().top - rect1.top
      }px)`;
    let elementIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.castleEnd
    );

    elementIndex.squareIndex = move.castleStart;
  } else if (move.isEnPassant) {
    pieceLocations.find(
      (obj) => obj.squareIndex === move.targetSquare
    ).squareIndex = move.startSquare;
    let enPassantPiece = pieceLocations.find(
      (obj) =>
        obj.squareIndex ==
        generateUniqueNumber(move.enPassantSquare, -board[move.targetSquare])
    );

    chessPieces[enPassantPiece.domIndex].style.display = "flex";
    enPassantPiece.squareIndex = move.enPassantSquare;
  } else if (move.isPromotion) {
    pieceLocations.find(
      (obj) => obj.squareIndex === move.targetSquare
    ).squareIndex = move.startSquare;
    chessPieces[pieceIndex].src =
      "../../assets/image-files/piece-images/" +
      (board[move.targetSquare] >= 0 ? 1 : -1) +
      ".png";

    if (move.capturePiece) {

      let capturedPiece = pieceLocations.find(
        (obj) =>
          obj.squareIndex ==
          generateUniqueNumber(move.targetSquare, move.capturePiece)
      );
      chessPieces[capturedPiece.domIndex].style.display = "flex";
      capturedPiece.squareIndex = move.targetSquare;
    }
  } else if (move.capturePiece) {
    pieceLocations.find(
      (obj) => obj.squareIndex === move.targetSquare
    ).squareIndex = move.startSquare;
    let elementIndex = pieceLocations.find(
      (obj) =>
        obj.squareIndex ===
        generateUniqueNumber(move.targetSquare, move.capturePiece)
    );
    chessPieces[elementIndex.domIndex].style.display = "flex";
    elementIndex.squareIndex = move.targetSquare;
  } else {
    pieceLocations.find(
      (obj) => obj.squareIndex === move.targetSquare
    ).squareIndex = move.startSquare;
  }

  playSoundEffects(type);

  document
    .getElementsByClassName("action")[3]
    .classList.remove("disabled-recapeButton");
  document
    .getElementsByClassName("action")[4]
    .classList.remove("disabled-recapeButton");
}

function addMoveToAnalysisBoard(board, movePlayed, check) {
  if (turn == -1) {
    let div = document.createElement("move");
    div.classList.add("move");
    div.classList.add("move-pc");
    //highlightine the current move
    let currentMove = document.getElementsByClassName("active-move");
    let len = currentMove.length;
    for (let i = 0; i < len; i++) {
      currentMove[0].classList.remove("active-move");
    }
    div.classList.add("active-move");
    let moveDiv = document.getElementsByClassName("moveDiv");
    let d = moveDiv[moveDiv.length - 1];
    let move = NameMove(movePlayed, board[movePlayed.targetSquare], check);
    div.innerHTML = `${move}`;
    d.appendChild(div.cloneNode(true));
    div.classList.add("move-mobile");
    div.classList.remove("move-pc");
    moveDiv[moveDiv.length / 2 - 1].appendChild(div);
    return;
  }
  NameMove;

  let move = NameMove(movePlayed, board[movePlayed.targetSquare], check);
  let moveDiv = document.createElement("div");
  moveDiv.classList.add("moveDiv");
  let numberDiv = document.createElement("div");
  numberDiv.classList.add("number-div");
  numberDiv.innerHTML = `${moveCount + 1}`;
  // numberDiv.classList.add('move')
  let div = document.createElement("div");
  div.classList.add("move");
  div.classList.add("move-pc");
  div.innerHTML = `${move}`;
  //
  //highlightine the current move
  let currentMove = document.getElementsByClassName("active-move");
  let len = currentMove.length;
  for (let i = 0; i < len; i++) {
    currentMove[0].classList.remove("active-move");
  }
  div.classList.add("active-move");
  //
  moveDiv.appendChild(numberDiv);

  moveDiv.appendChild(div);
  document
    .getElementsByClassName("analysis-board")[0]
    .appendChild(moveDiv.cloneNode(true));
  div.classList.add("move-mobile");
  div.classList.remove("move-pc");
  document
    .getElementsByClassName("analysis-board-mobile")[0]
    .appendChild(moveDiv.cloneNode(true));

  let scrollContainer = document.getElementsByClassName("analysis-board")[0];
  scrollContainer.scrollTop = scrollContainer.scrollHeight;
}

function MoveType(move) {
  if (move.isPromotion) {
    return "promotion";
  }
  //checking for castling
  else if (move.isCastle) {
    return "castle";
  }
  //checking for en passant
  else if (move.isEnPassant || move.capturePiece) {
    return "capture";
  }
  return "move";
}

/*event listener on the save game button*/
document
  .getElementsByClassName("save-game")[0]
  .addEventListener("click", (e) => {
    let date = new Date();
    let filename = date;
    downloadGame(filename);
  });



//function for enabling options
function enableOptions() {
  document.getElementsByClassName("resign")[0].classList.remove("disabled");
  document.getElementsByClassName("resign")[0].classList.add("enabled");
  document.getElementsByClassName("draw")[0].classList.remove("disabled");
  document.getElementsByClassName("draw")[0].classList.add("enabled");
  document.getElementsByClassName("abort")[0].classList.remove("enabled");
  document.getElementsByClassName("abort")[0].classList.add("disabled");
  document.getElementsByClassName("abort")[0].style.pointerEvents = "none";
}

function sendDataToServer() {
  let obj = {
    url: window.location.href,
    board: board,
    Moves: Moves,
  };

  socket.emit("save-board-data-online", JSON.stringify(obj));
}

function getGameData() {
  let moves = document.getElementsByClassName("move");
  let moveSerial = document.getElementsByClassName("number-div");
  let text = "";
  for (let i = 0; i < moves.length / 2; i++) {
    text +=
      i / 2 +
      1 +
      "." +
      " " +
      moves[i].innerHTML +
      " " +
      moves[i + 1].innerHTML +
      "  ";
    i++;
  }
  return text;
}

function downloadGame(filename) {
  // Assuming 'yourFileContent' is the content of your .pgn file
  let date = new Date();
  var heading = `[Event "Unratted PiChess Match"]\n[Date: "${date}"]\n[White "Player Anonymous"]\n[Black "Computer(depth ${Depth})"]\n\n`;
  var gameContent = heading + getGameData();

  var blob = new Blob([gameContent], { type: "application/octet-stream" });
  var url = URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.href = url;
  a.download = filename + ".pgn";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function MakeMove(board, move, smooth, sendToServer) {
  let type = MoveType(move);
  if (turn * perspective == 1) moveCount++;
  playMove(board, move);
  Moves.push(move);
  moveTypes.push(type);
  pointer++;
  let oppositeLegalMoves = allLegalMoves(board, -turn);
  let len = oppositeLegalMoves.length;

  let check = false;

  if (isUnderCheck(board, -turn)) {
    check = true;
    type = "check";
  }

  addMoveToAnalysisBoard(board, move, check);
  refreshBoard(move, smooth, type);

  unHightlight();

  if (check) checkKingIndex(-turn);
  changeTurn();
  if (sendToServer) {
    socket.emit("PlayedMove", { url: window.location.href, move: move });
  }
  if (Moves.length === 2) {

    enableOptions();
  }

  if (turn == 1) {
    document
      .getElementsByClassName("timer")[0]
      .classList.remove("disabled-white-timer");
    document
      .getElementsByClassName("timer")[1]
      .classList.add("disabled-black-timer");
  } else {
    document
      .getElementsByClassName("timer")[1]
      .classList.remove("disabled-black-timer");
    document
      .getElementsByClassName("timer")[0]
      .classList.add("disabled-white-timer");
  }
}

socket.on("gameover", (data) => {
  gameOver = true;

  removeBottomActions();
  document.getElementsByClassName("save-game")[0].style.display = "flex";

  if (data.ok == false) {
    return;
  }
  document.getElementsByClassName("gameover-box-wrapper")[0].style.display =
    "flex";

  let winner = data.winner;
  let winnerInfo = data.winnerInfo;
  let loserInfo = data.loserInfo;
  if (winner == 1) {
    document
      .getElementsByClassName("white-side")[0]
      .classList.add("winner-side");
    document
      .getElementsByClassName("black-side")[0]
      .classList.add("loser-side");

    document.getElementsByClassName("winner-name")[0].innerHTML = "White wins";
    document.getElementsByClassName("win-reason")[0].innerHTML =
      "(" + data.reason + ")";

    document.getElementsByClassName("name")[0].innerHTML = winnerInfo.username;
    document.getElementsByClassName("name")[1].innerHTML = loserInfo.username;

    document.getElementsByClassName("rating")[0].innerHTML = winnerInfo.rating;
    document.getElementsByClassName("rating")[1].innerHTML = loserInfo.rating;

    document.getElementsByClassName("change")[0].innerHTML =
      "( +" + winnerInfo.ratingChange + ")";
    document.getElementsByClassName("change")[1].innerHTML =
      "( " + loserInfo.ratingChange + ")";
  } else if (winner == -1) {
    document
      .getElementsByClassName("white-side")[0]
      .classList.add("loser-side");
    document
      .getElementsByClassName("black-side")[0]
      .classList.add("winner-side");

    document.getElementsByClassName("winner-name")[0].innerHTML = "Black wins";
    document.getElementsByClassName("win-reason")[0].innerHTML =
      "(" + data.reason + ")";

    document.getElementsByClassName("name")[1].innerHTML = winnerInfo.username;
    document.getElementsByClassName("name")[0].innerHTML = loserInfo.username;

    document.getElementsByClassName("rating")[1].innerHTML = winnerInfo.rating;
    document.getElementsByClassName("rating")[0].innerHTML = loserInfo.rating;

    document.getElementsByClassName("change")[1].innerHTML =
      "( +" + winnerInfo.ratingChange + ")";
    document.getElementsByClassName("change")[0].innerHTML =
      "( " + loserInfo.ratingChange + ")";
  } else {
    document.getElementsByClassName("winner-name")[0].innerHTML = "Draw";
    document.getElementsByClassName("win-reason")[0].innerHTML =
      "(" + data.reason + ")";
    document.getElementsByClassName("name")[0].innerHTML = winnerInfo.username;
    document.getElementsByClassName("name")[1].innerHTML = loserInfo.username;

    document.getElementsByClassName("rating")[0].innerHTML = winnerInfo.rating;
    document.getElementsByClassName("rating")[1].innerHTML = loserInfo.rating;
  }
  gameEnd.play()
});

function createGameoverSymbol(winnerIndex, loserIndex) {
  let div1 = document.createElement("div");
  div1.innerHTML = '<i class="fas fa-crown"></i>';
  div1.style.gridColumnStart = (winnerIndex % 8) + 1;
  div1.style.gridRowStart = Math.floor(winnerIndex / 8) + 1;
  div1.classList.add("winner-symbol");
  chessboard.appendChild(div1);

  let div2 = document.createElement("div");
  div2.classList.add("loser-symbol");
  div2.innerHTML = "#";
  div2.style.gridColumnStart = (loserIndex % 8) + 1;
  div2.style.gridRowStart = Math.floor(loserIndex / 8) + 1;
  chessboard.appendChild(div2);
}

function closeGameoverBoxDialog() {
  document.getElementsByClassName("gameover-box-wrapper")[0].style.display =
    "none";
}

function removeBottomActions() {
  document.getElementsByClassName("bottom-actions")[0].style.display = "none";
}

addEventListenerToMoveRecapeButtons();

function addEventListenerToMoveRecapeButtons() {
  let moveRecapeButtons = document.getElementsByClassName("action");
  moveRecapeButtons[1].addEventListener("click", (e) => {
    fastBackward();
  });
  moveRecapeButtons[2].addEventListener("click", (e) => {
    backward();
  });
  moveRecapeButtons[3].addEventListener("click", (e) => {
    forward();
  });
  moveRecapeButtons[4].addEventListener("click", (e) => {
    fastForward();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key == "ArrowLeft") {
      backward();
    } else if (e.key == "ArrowRight") {
      forward();
    } else if (e.key == "ArrowDown") {
      fastForward();
    } else if (e.key == "ArrowUp") {
      fastBackward();
    }
  });
}

function forward() {
  let moveRecapeButtons = document.getElementsByClassName("action");

  if (pointer < Moves.length) {
    refreshBoard(Moves[pointer], true, moveTypes[pointer]);
    pointer++;
  }
  if (pointer >= Moves.length) {
    chessboard.style.pointerEvents = "auto";
    moveRecapeButtons[3].classList.add("disabled-recapeButton");
    moveRecapeButtons[4].classList.add("disabled-recapeButton");
  } else {
    chessboard.style.pointerEvents = "none";
  }

  let active = document.getElementsByClassName("active-move");
  let len = active.length;
  for (let i = 0; i < len; i++) {
    active[0].classList.remove("active-move");
  }

  document
    .getElementsByClassName("move-pc")
  [pointer - 1].classList.add("active-move");
  document
    .getElementsByClassName("move-mobile")
  [pointer - 1].classList.add("active-move");
}

function backward() {
  let moveRecapeButtons = document.getElementsByClassName("action");

  if (pointer > 0) {
    unMakeMove(Moves[pointer - 1], true, moveTypes[pointer - 1]);
    if (pointer - 2 >= 0) {
      highlightLastMove(Moves[pointer - 2].startSquare, Moves[pointer - 2].targetSquare)
    }
    pointer--;
  }
  chessboard.style.pointerEvents = "none";
  if (pointer == 0) {
    moveRecapeButtons[2].classList.add("disabled-recapeButton");
    moveRecapeButtons[1].classList.add("disabled-recapeButton");
  }

  let active = document.getElementsByClassName("active-move");
  let len = active.length;
  for (let i = 0; i < len; i++) {
    active[0].classList.remove("active-move");
  }
  if (pointer) {
    document
      .getElementsByClassName("move-pc")
    [pointer - 1].classList.add("active-move");
    document
      .getElementsByClassName("move-mobile")
    [pointer - 1].classList.add("active-move");
  }
}

function fastForward() {
  let moveRecapeButtons = document.getElementsByClassName("action");

  if (Moves.length) {
    while (pointer < Moves.length) {
      refreshBoard(Moves[pointer], true, moveTypes[pointer]);
      pointer++;
    }
    chessboard.style.pointerEvents = "auto";
    moveRecapeButtons[4].classList.add("disabled-recapeButton");
    moveRecapeButtons[3].classList.add("disabled-recapeButton");

    let active = document.getElementsByClassName("active-move");
    let len = active.length;
    for (let i = 0; i < len; i++) {
      active[0].classList.remove("active-move");
    }
    document
      .getElementsByClassName("move-pc")
    [pointer - 1].classList.add("active-move");
    document
      .getElementsByClassName("move-mobile")
    [pointer - 1].classList.add("active-move");
  }
}

function fastBackward() {
  let moveRecapeButtons = document.getElementsByClassName("action");

  if (Moves.length) {
    while (pointer > 0) {
      unMakeMove(Moves[pointer - 1], true, moveTypes[pointer - 1]);
      if (pointer - 2 >= 0) {
        highlightLastMove(Moves[pointer - 2].startSquare, Moves[pointer - 2].targetSquare)
      }
      pointer--;
    }
    chessboard.style.pointerEvents = "none";
    moveRecapeButtons[1].classList.add("disabled-recapeButton");
    moveRecapeButtons[2].classList.add("disabled-recapeButton");

    let active = document.getElementsByClassName("active-move");
    let len = active.length;
    for (let i = 0; i < len; i++) {
      active[0].classList.remove("active-move");
    }
    document.getElementsByClassName("analysis-board")[0].scrollTop = 0;
  }
}

function boardToFen(board) {
  let fen = "";
  let emptyStreak = 0;
  for (let i = 0; i < 64; i++) {
    if (board[i]) {
      if (emptyStreak) {
        fen += emptyStreak.toString();
        emptyStreak = 0;
      }
      switch (board[i]) {
        case 10:
          fen += "Q";
          break;
        case 6:
          fen += "R";
          break;
        case 3:
          fen += "N";
          break;
        case 4:
          fen += "B";
          break;
        case 1:
          fen += "P";
          break;
        case 2:
          fen += "K";
          break;
        case -10:
          fen += "q";
          break;
        case -6:
          fen += "r";
          break;
        case -3:
          fen += "n";
          break;
        case -4:
          fen += "b";
          break;
        case -1:
          fen += "p";
          break;
        case -2:
          fen += "k";
          break;
      }
    } else {
      emptyStreak++;
      if (i % 8 == 7) {
        fen += emptyStreak.toString();
        emptyStreak = 0;
      }
    }
  }
  return fen;
}

function updateTime(myTime, oppositeTime) {
  let myMilliSeconds = myTime % 1000;
  let oppositeMilliSeconds = oppositeTime % 1000;
  let mySec = Math.floor(myTime / 1000);
  let oppositeSec = Math.floor(oppositeTime / 1000);

  let myMin = Math.floor(mySec / 60);
  let oppositeMin = Math.floor(oppositeSec / 60);

  mySec = mySec % 60;
  oppositeSec = oppositeSec % 60;

  document.getElementsByClassName("min")[0].innerHTML = formatTime(oppositeMin);
  document.getElementsByClassName("min")[1].innerHTML = formatTime(myMin);
  document.getElementsByClassName("sec")[0].innerHTML = formatTime(oppositeSec);
  document.getElementsByClassName("sec")[1].innerHTML = formatTime(mySec);

  document
    .getElementsByClassName("white-timer")[0]
    .classList.remove("low-timer");
  document
    .getElementsByClassName("black-timer")[0]
    .classList.remove("low-timer");
  if (myMin == 0 && mySec < 10) {
    document
      .getElementsByClassName("black-timer")[0]
      .classList.add("low-timer");
    document.getElementsByClassName("min")[1].innerHTML = formatTime(mySec);
    document.getElementsByClassName("sec")[1].innerHTML = formatTime(
      parseInt(myMilliSeconds / 10)
    );
  }
  if (oppositeMin === 0 && oppositeSec < 10) {
    document
      .getElementsByClassName("white-timer")[0]
      .classList.add("low-timer");
    document.getElementsByClassName("min")[0].innerHTML =
      formatTime(oppositeSec);
    document.getElementsByClassName("sec")[0].innerHTML = formatTime(
      parseInt(oppositeMilliSeconds / 10)
    );
  }
}

function formatTime(time) {
  if (time < 10 && time >= 0) {
    return "0" + time.toString();
  } else if (time < 0) {
    return "00";
  }
  return time.toString();
}

function addMoveBehaviourToPieces() {
  for (let i = 0; i < chessPieces.length; i++) {
    chessPieces[i].addEventListener("dragstart", (e) => {
      e.preventDefault();
    });
  }
  let draggedIndex = null;
  let draggedSquareIndex = null;
  let isdragging;
  let isClick;

  let clickCoordinates = null;

  chessboard.addEventListener("mousedown", (e) => {
    let i = FindTargetSquare(e);
    let pieceIndex = pieceLocations.find((obj) => obj.squareIndex === i);
    if (pieceIndex != null && !activeMoves.length && (turn == -1 || gameOver)) {
      activeMoves = finalLegalMoves(board, i, turn);
      highlight(
        activeMoves.map((obj) => obj.targetSquare),
        i
      );
      draggedIndex = pieceIndex.domIndex;
      draggedSquareIndex = i;
      isdragging = true;
      isClick = true;

      clickCoordinates = [e.clientX, e.clientY];
    } else if (activeMoves.length) {
      let targetSquare = FindTargetSquare(e);
      let playedMove = activeMoves.find(
        (obj) => obj.targetSquare === targetSquare
      );
      if (playedMove) {
        MakeMove(board, playedMove, true, true);
        chessPieces[draggedIndex].style.zIndex = "1";
        let legalSquares = document.getElementsByClassName("legal-square");
        for (let i = 0; i < legalSquares.length; i++) {
          document
            .getElementsByClassName("legal-square")
          [i].classList.remove("legal-square");
        }
      } else {
        let rect1 = squares[0].getBoundingClientRect();
        let rect2 = squares[draggedSquareIndex].getBoundingClientRect();

        chessPieces[draggedIndex].style.transform = `translate(${rect2.left - rect1.left
          }px, ${rect2.top - rect1.top}px)`;
      }

      unHightlight();
      activeMoves = [];
      draggedIndex = null;
      draggedSquareIndex = null;
      isdragging = false;
    }
  });
  chessboard.addEventListener("mousemove", (e) => {
    let targetSquare = FindTargetSquare(e);

    if (isdragging) {
      let rect = squares[0].getBoundingClientRect();

      chessPieces[draggedIndex].style.transform = `translate(${e.clientX - rect.width / 2 - rect.left
        }px, ${e.clientY - rect.height / 2 - rect.top}px)`;
      chessPieces[draggedIndex].style.zIndex = "100";
      let legalSquares = document.getElementsByClassName("legal-square");
      for (let i = 0; i < legalSquares.length; i++) {
        document
          .getElementsByClassName("legal-square")
        [i].classList.remove("legal-square");
      }

      if (activeMoves.some((obj) => obj.targetSquare === targetSquare)) {
        squares[targetSquare].classList.add("legal-square");
      }
    }
    isClick = false;
  });
  chessboard.addEventListener("mouseup", (e) => {
    let targetSquare = FindTargetSquare(e);

    if (clickCoordinates[0] == e.clientX && clickCoordinates[1] == e.clientY) {
      isdragging = false;
    }

    if (isdragging) {
      let playedMove = activeMoves.find(
        (obj) => obj.targetSquare === targetSquare
      );
      if (playedMove) {
        MakeMove(board, playedMove, false, true);
        chessPieces[draggedIndex].style.zIndex = "1";
        let legalSquares = document.getElementsByClassName("legal-square");
        for (let i = 0; i < legalSquares.length; i++) {
          document
            .getElementsByClassName("legal-square")
          [i].classList.remove("legal-square");
        }
      } else {
        let rect1 = squares[0].getBoundingClientRect();
        let rect2 = squares[draggedSquareIndex].getBoundingClientRect();

        chessPieces[draggedIndex].style.transform = `translate(${rect2.left - rect1.left
          }px, ${rect2.top - rect1.top}px)`;
      }

      unHightlight();
      activeMoves = [];
      draggedIndex = null;
      draggedSquareIndex = null;
      isdragging = false;
    } else if (isClick) {
      let i = FindTargetSquare(e);
      let pieceIndex = pieceLocations.find((obj) => obj.squareIndex === i);
      if (pieceIndex != null && !activeMoves.length) {
        activeMoves = finalLegalMoves(board, i, turn);
        highlight(
          activeMoves.map((obj) => obj.targetSquare),
          i
        );
        if (activeMoves.length) {
          draggedIndex = pieceIndex.domIndex;
          draggedSquareIndex = i;
          isdragging = true;
          isClick = true;
        }
      }
    }
  });
}

function FindTargetSquare(e) {
  let rect = chessboard.getBoundingClientRect();
  let x = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
  let y = Math.floor(((e.clientY - rect.top) / rect.height) * 8);

  return x + 8 * y;
}

function generateUniqueNumber(squareIndex, piece) {
  // Prime numbers for hashing
  const prime1 = 17;
  const prime2 = 31;

  // Generate unique number using prime number multiplication
  return squareIndex * prime1 + piece * prime2;
}

function displayCheatingWarning(name) {
  document.getElementsByClassName("cheater-username")[0].innerHTML = name;
  document.getElementsByClassName("warning-wrapper")[0].style.display = "flex";
}

function drawAckn() {
  socket.emit('draw-acknowledge')
  document.getElementsByClassName('opponent-draw')[0].style.display = 'none'
}
function drawDec() {
  document.getElementsByClassName('opponent-draw')[0].style.display = 'none'
  socket.emit('draw-decline')
}