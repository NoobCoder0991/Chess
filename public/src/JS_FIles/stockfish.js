var socket = io("/play/stockfish");

var pieceLocations = [];

let Depth = 4;
let moveSound = new Audio("../../assets/sound-files/lichess-move.ogg");
let captureSound = new Audio("../../assets/sound-files/lichess-capture.ogg");
let background = new Audio("../../assets/sound-files/background.mp3");
let castleSound = new Audio("../../assets/sound-files/castle.mp3");
let promotionSound = new Audio("../../assets/sound-files/promote.mp3");
let checkSound = new Audio("../../assets/sound-files/move-check.mp3");
let gameEnd = new Audio("../../assets/sound-files/end.webm");
let gameStart = new Audio("../../assets/sound-files/gameStart-alt.mp3");

// //creating chessboard

// //making chess board
let chessboard = document.getElementById("chessBoard");

var perspective = 1;
var str;
var board;
let boards = [];
setUpBoard(perspective);
function setUpBoard(perspective) {
  let str1 = "rnbqkbnrpppppppp8888PPPPPPPPRNBQKBNR";
  // str1 = "Bq1B1K23PpN2P3Pp2P1p2P22Pk1b1R1p6pN1P1P2QR6"
  // str1 = "85k1K6r13n48888";
  // str1 = "1qk5888884K38";
  // str1 = "1kr56QppP4p1P4p22q57P5PP14R1K1";
  let str2 = "RNBQKBNRPPPPPPPP8888pppppppprnbqkbnr";
  str = perspective == 1 ? str1 : str2;
  board = generateBoard(str);
  putPieceOnBoard(board);
}

let chessPieces = document.getElementsByClassName("piece");
let squares = document.getElementsByClassName("square");
// createCirclesOnSquares();
var turn = perspective;
var moveCount = 1;
var Moves = [];
var moveTypes = [];
boards.push(board);
var pointer = 0;
var activeMoves = [];
// //initial indices of kings
var indexOfWhiteKing = FindIndexOfWhiteKing(str);
var indexOfBlackKing = FindIndexOfBlackKing(str);

let diff = 0;

var gameOver = false;

// //
socket.emit("fetch-data-request", { url: window.location.href });
socket.on("fetch-data-responce", (data) => {
  if (data && data.board != undefined) {
    beginPlay();
    let tempMoves = Object.values(data.Moves);

    for (let i = 0; i < tempMoves.length; i++) {
      MakeMove(board, tempMoves[i], true);
    }

    document.getElementsByClassName("gameover-wrapper")[0].style.display =
      "none";
  }
});

for (let i = 0; i < squares.length; i++) {
  squares[i].addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  squares[i].addEventListener("drop", (e) => {
    let data = JSON.parse(e.dataTransfer.getData("text/plain"));
    chessPieces[data.pieceIndex].style.opacity = "1";
    let playedMove = data.moves.find((obj) => obj.targetSquare == i);
    if (playedMove) {
      MakeMove(board, playedMove, false);

      setTimeout(() => {
        gameEngine(board, -perspective);
      }, 300);
      document.getElementsByTagName("title")[0].innerHTML = "Computer playing";
    } else {
      unHightlight();
    }
  });

  squares[i].addEventListener("click", (e) => {
    if (activeMoves.length) {
      let playedMove = activeMoves.find((obj) => obj.targetSquare == i);
      if (playedMove) {
        MakeMove(board, playedMove, true);
        setTimeout(() => {
          gameEngine(board, -perspective);
        }, 300);
        document.getElementsByTagName("title")[0].innerHTML =
          "Computer playing";
      } else {
        unHightlight();
      }
      activeMoves = [];
    } else {
      activeMoves = [];
      unHightlight();
    }
  });
}

// //adding event listeners to actions button
let newGame = document.getElementsByClassName("new-game")[0];
let resignButton = document.getElementsByClassName("resign")[0];
let drawButton = document.getElementsByClassName("draw")[0];
let abortButton = document.getElementsByClassName("abort")[0];
let rematchButton = document.getElementsByClassName("rematch")[0];
// newGame.addEventListener("click", (e) => {
//   if (newGame.classList.contains("active-action")) {
//     newGame.classList.remove("active-action");

//     window.location.href = "/play-computer";
//     socket.emit("new-game-request", null);
//     socket.on("new-game-responce", (url) => {
//       window.location.href = url;
//     });
//   } else {
//     newGame.classList.add("active-action");
//     setTimeout(() => {
//       newGame.classList.remove("active-action");
//     }, 2000);
//   }
// });
resignButton.addEventListener("click", (e) => {
  if (resignButton.classList.contains("active-action")) {
    gameOver = true;
    removeBottomActions();
    document.getElementsByClassName("save-game")[0].style.display = "flex";
    document.getElementsByClassName("rematch")[0].style.display = "flex";
    gameEnd.play();
    document.getElementsByClassName("board")[0].style.pointerEvents = "none";

    printResult(true, "Black", "Resignation");
  } else {
    resignButton.classList.add("active-action");
    let ht = resignButton.innerHTML;
    setTimeout(() => {
      resignButton.classList.remove("active-action");
    }, 2000);
  }
});
drawButton.addEventListener("click", (e) => {
  if (moveCount >= 2) {
    drawButton.classList.remove("disabled");
    drawButton.classList.add("enabled");
    if (drawButton.classList.contains("active-action")) {
    } else {
      drawButton.classList.add("active-action");
      setTimeout(() => {
        drawButton.classList.remove("active-action");
      }, 2000);
    }
  }
});
abortButton.addEventListener("click", (e) => {
  if (abortButton.classList.contains("active-action")) {
    gameOver = true;
    removeBottomActions();
    document.getElementsByClassName("save-game")[0].style.display = "flex";

    document.getElementsByClassName("rematch")[0].style.display = "flex";
    gameEnd.play();
    chessboard.pointerEvents = "none";

    printResult(false, "Aborted");
  } else {
    abortButton.classList.add("active-action");
    setTimeout(() => {
      abortButton.classList.remove("active-action");
    }, 2000);
  }
});
rematchButton.addEventListener("click", (e) => {
  socket.emit("new-game-request", null);
  socket.on("new-game-responce", (url) => {
    window.location.href = url;
  });
});
// //some variables for checking the availability of en passant
let enPassantForWhite = [false, -1];
let enPassantForBlack = [false, -1];
let whiteCastle = [true, true];
let blackCastle = [true, true];

let legal = [];
let moveActive = [false, -1];
let previousIndex = 0;
for (let i = 0; i < chessPieces.length; i++) {
  addDragAndDropBehaviour(i, turn);
  addClickBehaviour(i, turn);
}

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
    piece.style.transform = `translate(${rect2.left - rect1.left}px, ${
      rect2.top - rect1.top
    }px)`;
    chessboard.appendChild(piece);
    pieceLocations.push({ domIndex: count, squareIndex: i });
    count++;
  }
}

// //to highlight moves i put small circles on each square
function createCirclesOnSquares() {
  for (let i = 0; i < 64; i++) {
    let circle = document.createElement("div");
    circle.classList.add("highlight-circle");
    circle.style.gridColumnStart = (i % 8) + 1;
    circle.style.gridRowStart = Math.floor(i / 8) + 1;

    chessboard.appendChild(circle);
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
    document.getElementById("chessBoard").removeChild(options[0]);
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

/*Alpha Beta search*/

// //checking for castling rights

function checkForCastlingRights(initial, final) {
  if (initial == 60) {
    whiteCastle = [false, false];
  }
  if (initial == 4) {
    blackCastle = [false, false];
  }
  if (initial == 63 || final == 63) {
    whiteCastle[0] = false;
  }
  if (initial == 56 || final == 56) {
    whiteCastle[1] = false;
  }
  if (initial == 0 || final == 0) {
    blackCastle[1] = false;
  }
  if (initial == 7 || final == 7) {
    blackCastle[0] = false;
  }
}

//checking for en passant rights

function checkForEnPassantRights(board, initial, final, color) {
  let y1 = Math.floor(initial / 8);
  let y2 = Math.floor(final / 8);

  if (board[final] == 1 && y1 == 6 && y2 == 4 && color == 1) {
    enPassantForWhite = [false, -1];
    enPassantForBlack = [true, final];
  } else if (board[final] == -1 && y1 == 1 && y2 == 3 && color == -1) {
    enPassantForBlack = [false, -1];
    enPassantForWhite = [true, final];
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

function NameMove(sourcePiece, targetPiece, sourceIndex, targetIndex) {
  if (sourceIndex == 60 && targetIndex == 62 && sourcePiece == 2) {
    return "O-O";
  }
  if (sourceIndex == 60 && targetIndex == 58 && sourcePiece == 2) {
    return "O-O-O";
  }
  if (sourceIndex == 4 && targetIndex == 6 && sourcePiece == -2) {
    return "O-O";
  }
  if (sourceIndex == 4 && targetIndex == 2 && sourcePiece == -2) {
    return "O-O-O";
  }

  let moveName = "";

  let sourcePieceName = "";
  if (Math.abs(sourcePiece) == 2) sourcePieceName = "&#9818";
  if (Math.abs(sourcePiece) == 10) sourcePieceName = "&#9819";
  if (Math.abs(sourcePiece) == 6) sourcePieceName = "&#9820";
  if (Math.abs(sourcePiece) == 4) sourcePieceName = "&#9821";
  if (Math.abs(sourcePiece) == 3) sourcePieceName = "&#9822";
  if (Math.abs(sourcePiece) == 1) sourcePieceName = "&#9823";
  // let sourceSquare=NameSquare(sourceIndex)
  let targetSquare = NameSquare(targetIndex);
  if (targetPiece == 0) {
    moveName += `${sourcePieceName}${targetSquare}`;
  } else {
    // if(Math.abs(sourcePiece)==1) moveName+='P'
    moveName += `${sourcePieceName}&times${targetSquare}`;
  }

  return moveName;
}

function NameSquare(index) {
  let letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  let name = "";
  let x = index % 8;
  let y = 8 - Math.floor(index / 8);
  name += letters[x];
  name += y.toString();
  return name;
}

function highlight(moves, index) {
  document
    .getElementsByClassName("square")
    [index].classList.add("click-square");
  let count = 0;
  for (move of moves) {
    if (count % 2 == 0) {
      document
        .getElementsByClassName("square")
        [move].classList.add("even-colored-square");
    } else {
      document
        .getElementsByClassName("square")
        [move].classList.add("odd-colored-square");
    }
    count++;
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
      MakeMove(board, playedMove, false);
      setTimeout(() => {
        gameEngine(board, -perspective);
      }, 300);
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
        MakeMove(board, playedMove, true);
        setTimeout(() => {
          gameEngine(board, -perspective);
        }, 300);
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
      legal.forEach((index) => {
        if (!arr.includes(index)) {
          arr.push(index);
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
            promotionPiece: 10,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 6,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 4,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 8,
            capturePiece: board[index - 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 3,
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
            promotionPiece: 10,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 6,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 4,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 7,
            capturePiece: board[index - 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 3,
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
            promotionPiece: 10,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 6,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 4,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index - 9,
            capturePiece: board[index - 9],
            isCastle: false,
            isPromotion: true,
            promotionPiece: 3,
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
            promotionPiece: -10,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -6,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -4,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 8,
            capturePiece: board[index + 8],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -3,
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
            promotionPiece: -10,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            isCastle: false,
            capturePiece: board[index + 9],
            isPromotion: true,
            promotionPiece: -6,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            isCastle: false,
            capturePiece: board[index + 9],
            isPromotion: true,
            promotionPiece: -4,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 9,
            isCastle: false,
            capturePiece: board[index + 9],
            isPromotion: true,
            promotionPiece: -3,
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
            promotionPiece: -10,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -6,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -4,
            isEnPassant: false,
          });
          legalmoves.push({
            startSquare: index,
            targetSquare: index + 7,
            capturePiece: board[index + 7],
            isCastle: false,
            isPromotion: true,
            promotionPiece: -3,
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
    if (index == 60 && board[index] == 2) {
      //it may have right to castle

      if (
        whiteCastle[0] &&
        board[61] == 0 &&
        board[62] == 0 &&
        !attacked.includes(61)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 62,
          capturePiece: 0,
          isCastle: true,
          castleStart: 63,
          castleEnd: 61,
          isPromotion: false,
          isEnPassant: false,
        });
      }
      if (
        whiteCastle[1] &&
        board[59] == 0 &&
        board[58] == 0 &&
        board[57] == 0 &&
        !attacked.includes(59)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 58,
          capturePiece: 0,
          isCastle: true,
          castleStart: 56,
          castleEnd: 59,
          isPromotion: false,
          isEnPassant: false,
        });
      }
    }
    if (index == 4 && board[index] == -2) {
      if (
        blackCastle[0] &&
        board[5] == 0 &&
        board[6] == 0 &&
        !attacked.includes(5)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 6,
          capturePiece: 0,
          isCastle: true,
          castleStart: 7,
          castleEnd: 5,
          isPromotion: false,
          isEnPassant: false,
        });
      }
      if (
        blackCastle[1] &&
        board[2] == 0 &&
        board[3] == 0 &&
        board[1] == 0 &&
        !attacked.includes(3)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: 2,
          capturePiece: 0,
          isCastle: true,
          castleStart: 0,
          castleEnd: 3,
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
        targetSquare: position - 8,
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
        targetSquare: position + 8,
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

function refreshBoard(move, smooth) {
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

  chessPieces[pieceIndex].style.transform = `translate(${
    rect2.left - rect1.left
  }px, ${rect2.top - rect1.top}px)`;
  if (move.capturePiece) {
    let elementIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.targetSquare
    );
    chessPieces[elementIndex.domIndex].style.display = "none";
    elementIndex.squareIndex = -move.targetSquare;
  }
  if (move.isCastle) {
    let castlePieceIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.castleStart
    ).domIndex;
    chessPieces[castlePieceIndex].classList.add("smooth-piece");
    setTimeout(() => {
      chessPieces[castlePieceIndex].classList.remove("smooth-piece");
    }, 300);
    chessPieces[castlePieceIndex].style.transform = `translate(${
      squares[move.castleEnd].getBoundingClientRect().left - rect1.left
    }px, ${squares[move.castleEnd].getBoundingClientRect().top - rect1.top}px)`;
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
    enPassantPiece.squareIndex = -move.enPassantSquare;
  } else {
  }
}
//Main Game Engine(New optimized,fast and powerful)
socket.on("fetch-move-responce", (move) => {
  console.log(move);
  move.capturePiece = board[move.targetSquare];
  MakeMove(board, move, true);
});
function gameEngine(board, color) {
  let depth = 2 * Depth;

  socket.emit("fetch-move", { fen: boardToFen(board), depth: depth });

  document.getElementsByTagName("title")[0].innerHTML = "Your Turn";
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
  }
}

//Main min-max search function

function search(board, color, depth) {
  if (depth == 0) {
    return [evaluatePosition(board, color)];
  }
  let legalMovesForEngine = allLegalMoves(board, color);
  let len = legalMovesForEngine.length;
  if (len == 0) {
    let check = isUnderCheck(board, color);
    if (check) {
      //checkmate
      return [-Infinity];
    }
    //stalemate
    return [0];
  }
  let bestEvaluation = -Infinity;

  let index = [];

  for (let i = 0; i < len; i++) {
    let move = legalMovesForEngine[i];

    //store the castling and en passant rights in a sepatete variable and them pass them into the unMove fuction
    let cRights = storeCastlingRights();
    let eRights = storeEnPassantRights();

    playMove(board, move);
    let value = -search(board, -color, depth - 1)[0];

    if (value == Infinity && isUnderCheck(board, -color)) {
      unMove(board, move, cRights, eRights);

      bestEvaluation = value;
      index = [];
      index.push(move);
      return [bestEvaluation, index];
    } else if (value > bestEvaluation) {
      bestEvaluation = value;
      index = [];
      index.push(move);
    } else if (bestEvaluation == value && !index.includes(move)) {
      index.push(move);
    }

    unMove(board, move, cRights, eRights);
  }

  return [bestEvaluation, index];
}

function evaluatePosition(board, color) {
  let myColorValue = 0,
    oppositeColorValue = 0;
  board.forEach((element) => {
    if (element * color > 0) {
      myColorValue += Math.abs(element);
      if (Math.abs(element) == 4) myColorValue -= 0.8;
    } else {
      oppositeColorValue += Math.abs(element);
      if (Math.abs(element) == 4) oppositeColorValue -= 0.8;
    }
  });

  return (
    myColorValue -
    oppositeColorValue +
    endgameEvaluation(board, color) +
    mapEvaluation(board, color)
  );
}

//Altering the evaluation function to make the engine play endgame (like a pro)

function endgameEvaluation(board, color) {
  let endgameFactor = totalPieces(board, -color);
  // let endgameFactor = material(board,-color)
  let evaluation = 0;
  let indexOfMyKing = positionOfKing(color);
  let indexOfOpponentKing = positionOfKing(-color);
  let x1 = indexOfOpponentKing % 8,
    y1 = Math.floor(indexOfOpponentKing / 8);

  let distance = Math.abs(x1 - 3.5) + Math.abs(y1 - 3.5); // distance of opponent king from the center
  let x2 = indexOfMyKing % 8,
    y2 = Math.floor(indexOfMyKing / 8);
  //distance between kings

  let kingsDistance = Math.abs(x1 - x2) + Math.abs(y1 - y2);
  if (color == turn) {
    evaluation += distance;
    if (x1 == 0 || y1 == 0 || x1 == 7 || y1 == 7) {
      evaluation += 6 / kingsDistance;
    }
  }

  evaluation = evaluation / endgameFactor;
  return evaluation;
}

//function for map evaluation
function mapEvaluation(board, color) {
  let myColorMap = 0;
  let maxPossible = 0;
  for (let index = 0; index < 64; index++) {
    if (board[index] * color > 0) {
      switch (board[index]) {
        case 10:
          myColorMap += whiteQueenMap[index];
          maxPossible += 3;
          break;
        case 6:
          myColorMap += whiteRookMap[index];
          maxPossible += 5;
          break;
        case 4:
          myColorMap += whiteBishopMap[index];
          maxPossible += 4;
          break;
        case 3:
          myColorMap += whiteKnightMap[index];
          maxPossible += 4;
          break;
        case 2:
          myColorMap += whiteKingMap[index];
          maxPossible += 3;
          break;
        case 1:
          myColorMap += whitePawnMap[index];
          maxPossible += 5;
          break;
        case -10:
          myColorMap += blackQueenMap[index];
          maxPossible += 3;
          break;
        case -6:
          myColorMap += blackRookMap[index];
          maxPossible += 5;
          break;
        case -4:
          myColorMap += blackBishopMap[index];
          maxPossible += 4;
          break;
        case -3:
          myColorMap += blackKnightMap[index];
          maxPossible += 4;
          break;
        case -2:
          myColorMap += blackKingMap[index];
          maxPossible += 3;
          break;
        case -1:
          myColorMap += blackPawnMap[index];
          maxPossible += 5;
          break;
      }
    }
  }

  return myColorMap / maxPossible;
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
    let a = move.targetSquare - move.startSquare;
    if (a >= 0) {
      board[move.targetSquare - 1] = board[move.targetSquare + 1];
      board[move.targetSquare + 1] = 0;
    } else {
      board[move.targetSquare + 1] = board[move.targetSquare - 2];
      board[move.targetSquare - 2] = 0;
    }
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
    let a = move.targetSquare - move.startSquare;
    if (a > 0) {
      board[move.targetSquare + 1] = board[move.targetSquare - 1];
      board[move.targetSquare - 1] = 0;
    } else {
      board[move.targetSquare - 2] = board[move.targetSquare + 1];
      board[move.targetSquare + 1] = 0;
    }
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
function addMoveToAnalysisBoard(board, initial, final, flag) {
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
    let move = NameMove(board[initial], board[final], initial, final);
    div.innerHTML = `${move}`;
    d.appendChild(div.cloneNode(true));
    div.classList.add("move-mobile");
    div.classList.remove("move-pc");
    moveDiv[moveDiv.length / 2 - 1].appendChild(div);
    return;
  }

  let move = NameMove(board[initial], board[final], initial, final);
  let moveDiv = document.createElement("div");
  moveDiv.classList.add("moveDiv");
  let numberDiv = document.createElement("div");
  numberDiv.classList.add("number-div");
  numberDiv.innerHTML = `${moveCount - 1}`;
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

function printResult(resultFlag, name, reason) {
  if (resultFlag) {
    /*some one won the game*/
    document.getElementsByClassName(
      "winner-name"
    )[0].innerHTML = `${name} wins <i class="fas fa-trophy"></i>`;
    document.getElementsByClassName("win-reason")[0].innerHTML = `(${reason})`;

    if (name == "White") {
      document.getElementsByClassName("my-side")[0].classList.add("winner");
      document
        .getElementsByClassName("opposite-side")[0]
        .classList.add("loser");
    } else {
      document.getElementsByClassName("my-side")[0].classList.add("loser");
      document
        .getElementsByClassName("opposite-side")[0]
        .classList.add("winner");
    }
  } else {
    if (name == "Draw") {
      document.getElementsByClassName(
        "winner-name"
      )[0].innerHTML = `Draw  <i class="fas fa-balance-scale"></i>`;
      document.getElementsByClassName(
        "win-reason"
      )[0].innerHTML = `(${reason})`;
    } else {
      document.getElementsByClassName(
        "winner-name"
      )[0].innerHTML = `Aborted <i class="fas fa-balance-scale"></i>`;
    }
  }

  document.getElementsByClassName("gameover-box-wrapper")[0].style.display =
    "flex";
}

//function for enabling options
function enableOptions() {
  document.getElementsByClassName("resign")[0].classList.remove("disabled");
  document.getElementsByClassName("resign")[0].classList.add("enabled");
  document.getElementsByClassName("abort")[0].classList.remove("enabled");
  document.getElementsByClassName("abort")[0].classList.add("disabled");
  document.getElementsByClassName("abort")[0].style.pointerEvents = "none";
}

function sendDataToServer() {
  let obj = {
    url: window.location.href,
    board: board,
    boards: boards,
    Moves: Moves,
    pieceLocations: pieceLocations,
    turn: turn,
    depth: Depth,
    moveCount: moveCount,
    moveTypes: moveTypes,
    pointer: pointer,
    indexOfBlackKing: indexOfBlackKing,
    indexOfWhiteKing: indexOfWhiteKing,
    gameOver: gameOver,
    analysisBoard:
      document.getElementsByClassName("analysis-board")[0].innerHTML,
    analysisBoardMobile: document.getElementsByClassName(
      "analysis-board-mobile"
    )[0].innerHTML,
  };

  socket.emit("save-board-data", JSON.stringify(obj));
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

function MakeMove(board, move, smooth) {
  beginPlay();
  let type = MoveType(move);
  if (turn == 1) moveCount++;
  addMoveToAnalysisBoard(board, move.startSquare, move.targetSquare);
  playMove(board, move);
  boards.push(board);
  Moves.push(move);
  moveTypes.push(type);
  pointer++;
  let oppositeLegalMoves = allLegalMoves(board, -turn);
  let len = oppositeLegalMoves.length;

  let check = false;

  if (isUnderCheck(board, -turn)) {
    check = true;
    if (len == 0) {
      gameOver = true;
    }

    type = "check";
  }

  playSoundEffects(type);

  refreshBoard(move, smooth);

  unHightlight();
  legal = [];
  moveActive[0] = false;
  highlightLastMove(move.startSquare, move.targetSquare);
  if (check) checkKingIndex(-turn);
  if (gameOver) {
    removeBottomActions();
    document.getElementsByClassName("save-game")[0].style.display = "flex";

    document.getElementsByClassName("rematch")[0].style.display = "flex";
    setTimeout(() => {
      gameEnd.play();

      if (turn == 1) {
        printResult(true, "White", "Checkmate");
        chessboard.pointerEvents = "none";
      } else {
        printResult(true, "Black", "Checkmate");
        chessboard.pointerEvents = "none";
      }
    }, 1000);
  }

  if (move.isCastle) {
    let elementIndex = pieceLocations.find(
      (obj) => obj.squareIndex === move.castleStart
    );
    elementIndex.squareIndex = move.castleEnd;
  }

  pieceLocations.find(
    (obj) => obj.squareIndex === move.startSquare
  ).squareIndex = move.targetSquare;

  changeTurn();
  sendDataToServer();
  enableOptions();
}

function dummyMove(move, smooth, reverse) {
  let copyMove = { ...move };
  if (reverse) {
    let temp = copyMove.startSquare;
    copyMove.startSquare = copyMove.targetSquare;
    copyMove.targetSquare = temp;
  }
  refreshBoard(copyMove, true);
  if (copyMove.capturePiece) {
    let index = pieceLocations.find(
      (obj) => obj.squareIndex === -copyMove.startSquare
    ).domIndex;
    chessPieces[index].style.display = "flex";
  }
}
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
  document.getElementsByClassName("bottom-actions")[0].remove();
}

addEventListenerToMoveRecapeButtons();

function addEventListenerToMoveRecapeButtons() {
  let moveRecapeButtons = document.getElementsByClassName("action");
  moveRecapeButtons[1].addEventListener("click", (e) => {
    if (Moves.length) {
      while (pointer > 0) {
        dummyMove(Moves[pointer - 1], true, true);
        pointer--;
      }
      document.getElementsByClassName("board-wrapper")[0].style.display =
        "flex";
    }
  });
  moveRecapeButtons[2].addEventListener("click", (e) => {
    if (pointer > 0) {
      dummyMove(Moves[pointer - 1], true, true);
      pointer--;
    }
  });
  moveRecapeButtons[3].addEventListener("click", (e) => {
    if (pointer < Moves.length) {
      dummyMove(Moves[pointer], true, false);
      pointer++;
    }
  });
  moveRecapeButtons[4].addEventListener("click", (e) => {
    console.log("fast forward");
  });
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
    if (i % 8 == 7 && i != 63) {
      fen += "/";
    }
  }
  if (turn == 1) {
    fen += " w";
  } else {
    fen += " b ";
  }

  if (whiteCastle[0]) {
    fen += " K";
  }
  if (whiteCastle[1]) {
    fen += "Q";
  }
  if (blackCastle[0]) {
    fen += " k";
  }
  if (blackCastle[1]) {
    fen += "q";
  }

  fen += " - ";

  return fen;
}

function selectOpponent(element) {
  let bot_names = [
    "Timid Pawn",
    "Faltering Knight",
    "Vulnerable Bishop",
    "Doubting Rook",
    "Wavering Queen",
    "Fragile King",
    "Insecure Monarch",
    "Feeble Sovereign",
  ];
  var bot_descriptions = [
    "Hi, I am Timid Pawn(350). I may stumble in the face of challenges.",
    "Greetings, I am Faltering Knight(700). I strive to improve my skills.",
    "Salutations! I am Vulnerable Bishop(1050). My defenses are not impenetrable.",
    "Hello, I am Doubting Rook(1400). I sometimes second-guess my moves.",
    "Good day! I am Wavering Queen(1750). My confidence may waver under pressure.",
    "Greetings, I am Fragile King(2100). My reign is not without vulnerability.",
    "Hello, I am Insecure Monarch(2450). I may falter in my leadership.",
    "Greetings, I am Feeble Sovereign(2800). My strength is yet to be fully realized.",
  ];

  // Accessing the description of the first bot (Timid Pawn)
  var description_of_timid_pawn = bot_descriptions[0];
  console.log(description_of_timid_pawn); // Output: "Hi, I am Timid Pawn(800). I may stumble in the face of challenges."

  // Accessing the description of the second bot (Faltering Knight)
  var description_of_faltering_knight = bot_descriptions[1];
  console.log(description_of_faltering_knight); // Output: "Greetings, I am Faltering Knight(1200). I strive to improve my skills."

  // Similarly, you can access descriptions of other bots using their respective indices

  document
    .getElementsByClassName("active-opponent")[0]
    .classList.remove("active-opponent");
  element.classList.add("active-opponent");

  Depth =
    Array.from(document.getElementsByClassName("opponent")).indexOf(element) +
    1;
  document.getElementsByClassName("opponent-profile-description")[0].innerHTML =
    bot_descriptions[Depth - 1];
  document.getElementsByClassName("opponent-profile-name")[0].innerHTML =
    bot_names[Depth - 1] + "(" + Depth * 350 + ")";

  document.getElementsByClassName("profile-name")[0].innerHTML =
    bot_names[Depth - 1];
  document.getElementsByClassName("profile-rating")[0].innerHTML =
    "(" + Depth * 350 + ")";
}

function beginPlay() {
  document.getElementsByClassName("second-board")[0].style.display = "flex";
  document.getElementsByClassName("opponent-selection-board")[0].style.display =
    "none";
}
