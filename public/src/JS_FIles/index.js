let navOptions = document.getElementsByClassName("nav-option");
for (let i = 0; i < navOptions.length; i++) {
  navOptions[i].addEventListener("mouseover", (e) => {
    navOptions[i].getElementsByClassName(
      "play-dropdown-cover"
    )[0].style.display = "flex";
  });
  navOptions[i].addEventListener("mouseout", (e) => {
    navOptions[i].getElementsByClassName(
      "play-dropdown-cover"
    )[0].style.display = "none";
  });
}

let fen = "Bq1B1K2/3PpN2/P3Pp2/P1p2P2/2Pk1b1R/1p6/pN1P1P2/QR6";
setupBoard(fen, document.getElementsByClassName("puzzle-board")[0]);
var socket = io();

/* Evenet listener to play online button*/
let playOnlineButton = document.getElementById("play-online-button");
playOnlineButton.addEventListener("click", (e) => {
  window.location.href = "/play/online";
});

let playComputerButton = document.getElementById("play-mycomputer-button");

playComputerButton.addEventListener("click", (e) => {
  window.location.href = "/play/computer";
});

let playStockfishButton = document.getElementById("play-stockfish-button");

playStockfishButton.addEventListener("click", (e) => {
  window.location.href = "/play/stockfish";
});

let playCustomButton = document.getElementById("play-custom-button");
playCustomButton.addEventListener("click", (e) => {
  window.location.href = "/play/custom";
});

function setupBoard(fen, board) {
  let squareIndex = 0;
  for (let i = 0; i < fen.length; i++) {
    if (fen[i] == "/") {
      continue;
    } else if (fen[i] >= "1" && fen[i] <= "8") {
      /**/
      squareIndex += parseInt(fen[i]);
    } else {
      let pieceName = decodePieceName(fen[i]);
      let square = board.getElementsByClassName("square")[squareIndex];
      let rect = square.getBoundingClientRect();
      let piece = document.createElement("img");
      piece.classList.add("piece");
      piece.src = "../../assets/image-files/piece-images/" + pieceName + ".png";

      square.append(piece);

      squareIndex++;
    }
  }
}

function decodePieceName(piece) {
  let a;
  switch (piece) {
    case "Q":
      a = 10;
      break;
    case "R":
      a = 6;
      break;
    case "N":
      a = 3;
      break;
    case "B":
      a = 4;
      break;
    case "K":
      a = 2;
      break;
    case "P":
      a = 1;
      break;
    case "q":
      a = -10;
      break;
    case "r":
      a = -6;
      break;
    case "n":
      a = -3;
      break;
    case "b":
      a = -4;
      break;
    case "k":
      a = -2;
      break;
    case "p":
      a = -1;
      break;
  }
  return a;
}

function playMove(initial, final) {
  let startSquare = document.getElementsByClassName("square")[initial];
  let targetSquare = document.getElementsByClassName("square")[final];
  let startPiece = startSquare.getElementsByClassName("piece")[0];
  let targetRect = targetSquare.getBoundingClientRect();
  let startRect = startSquare.getBoundingClientRect();

  startPiece.style.transform = `translate(${
    targetRect.left - startRect.left
  }px, ${targetRect.top - startRect.top}px)`;

  setTimeout(() => {
    let existingPiece = targetSquare.getElementsByClassName("piece");
    if (existingPiece.length) {
      existingPiece[0].remove();
    }
    targetSquare.appendChild(startPiece);
    startPiece.style.transform = `translate(0px,0px)`;
  }, 110);
}
