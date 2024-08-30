//Generalized maps for the pieces

const { startsWith } = require("lodash");
const { Namespace } = require("socket.io");

function startPos(color) {

  if (color == 1) {
    return [-6, -3, -4, -10, -2, -4, -3, -6, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 6, 3, 4, 10, 2, 4, 3, 6]
  }
  else {

    return [6, 3, 4, 2, 10, 4, 3, 6, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -6, -3, -4, -2, -10, -4, -3, -6]
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

function checkForCastlingRights(move, whiteCastle, blackCastle, perspective) {
  let initial = move.startSquare, final = move.targetSquare;
  if (perspective == 1) {
    if (initial == 60) {
      whiteCastle[0] = false;
      whiteCastle[1] = false;
    }
    if (initial == 4) {
      blackCastle[0] = false;
      blackCastle[1] = false;
    }
  }

  else {
    if (initial == 59) {
      blackCastle[0] = false;
      blackCastle[1] = false;

    }
    if (initial == 3) {
      whiteCastle[0] = false;
      whiteCastle[1] = false;
    }
  }



  if (initial == 63) {
    perspective == 1 ? whiteCastle[0] = false : blackCastle[1] = false;
  }
  else if (initial == 56) {
    perspective == 1 ? whiteCastle[1] = false : blackCastle[0] = false;
  }
  else if (initial == 7) {
    perspective == 1 ? blackCastle[0] = false : whiteCastle[1] = false;
  }
  else if (initial == 0) {
    perspective == 1 ? blackCastle[1] = false : whiteCastle[0] = false;
  }

  return;

}

//checking for en passant rights

function checkForEnPassantRights(board, initial, final, color, enPassantForWhite, enPassantForBlack, perspective) {
  let y1 = Math.floor(initial / 8);
  let y2 = Math.floor(final / 8);

  if (
    board[final] == perspective &&
    y1 == 6 &&
    y2 == 4 &&
    color == perspective
  ) {
    if (perspective == 1) {
      enPassantForWhite[0] = false;
      enPassantForWhite[1] = -1;
      enPassantForBlack[0] = true;
      enPassantForBlack[1] = final
    } else {
      enPassantForWhite[0] = true;
      enPassantForWhite[1] = final;
      enPassantForBlack[0] = false;
      enPassantForBlack[1] = -1;
    }
  } else if (
    board[final] == -perspective &&
    y1 == 1 &&
    y2 == 3 &&
    color == -perspective
  ) {
    if (perspective == 1) {
      enPassantForBlack[0] = false;
      enPassantForBlack[1] = -1;
      enPassantForWhite[0] = true;
      enPassantForWhite[1] = final;
    } else {
      enPassantForBlack[0] = true;
      enPassantForBlack[1] = final;
      enPassantForWhite[0] = false;
      enPassantForWhite[1] = -1;
    }
  } else {
    enPassantForBlack[0] = false
    enPassantForBlack[1] = -1
    enPassantForWhite[0] = false
    enPassantForWhite[1] = -1
  }
}
// //storing castling rights
function storeCastlingRights(whiteCastle, blackCastle) {
  let rights1 = [...whiteCastle];
  let rights2 = [...blackCastle];
  return [rights1, rights2];
}

function storeEnPassantRights(enPassantForWhite, enPassantForBlack) {
  let b1 = [...enPassantForWhite];
  let b2 = [...enPassantForBlack];
  return [b1, b2];
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
function rookMoves(board, index, color) {
  let legalmoves = []
  let x = index % 8, y = Math.floor(index / 8)
  let top = [x, y - 1],
    left = [x - 1, y],
    bottom = [x, y + 1],
    right = [x + 1, y];

  let directions = [top, bottom, left, right]
  let vectors = [
    [0, -1], [0, 1], [-1, 0], [1, 0]
  ]
  for (let i = 0; i < directions.length; i++) {
    let direction = directions[i];

    while (!isOutsideBoard(direction)) {
      let squareIndex = coordinatesToIndex(direction)
      if (board[squareIndex] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: squareIndex,
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[squareIndex] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: squareIndex,
          capturePiece: board[squareIndex],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }

      direction[0] += vectors[i][0];
      direction[1] += vectors[i][1];
    }
  }

  return legalmoves;
}

function bishopMoves(board, index, color) {

  let legalmoves = []
  let x = index % 8, y = Math.floor(index / 8)
  let topRight = [x + 1, y - 1],
    topLeft = [x - 1, y - 1],
    bottomRight = [x + 1, y + 1],
    bottomLeft = [x - 1, y + 1];
  let directions = [topRight, topLeft, bottomRight, bottomLeft]
  let vectors = [
    [1, -1], [-1, -1], [1, 1], [-1, 1]
  ]
  for (let i = 0; i < directions.length; i++) {
    let direction = directions[i];

    while (!isOutsideBoard(direction)) {
      let squareIndex = coordinatesToIndex(direction)
      if (board[squareIndex] == 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: squareIndex,
          capturePiece: 0,
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      } else if (board[squareIndex] * color > 0) {
        break;
      } else {
        legalmoves.push({
          startSquare: index,
          targetSquare: squareIndex,
          capturePiece: board[squareIndex],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

        break;
      }

      direction[0] += vectors[i][0];
      direction[1] += vectors[i][1];
    }
  }

  return legalmoves;

}

function legalMoves(board, index, turn, perspective) {
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
    legalmoves = legalmoves.concat(rookMoves(board, index, color))
    // legalmoves = legalmoves.concat(rookMovesUsingBitboards(board, index, color))



  }

  else if (piece == 4) {
    legalmoves = legalmoves.concat(bishopMoves(board, index, color))
    // legalmoves = legalmoves.concat(bishopMovesUsingBitboards(board, index, color))



  }

  else if (piece == 10) {
    legalmoves = legalmoves.concat(rookMoves(board, index, color))
    legalmoves = legalmoves.concat(bishopMoves(board, index, color))
    // legalmoves = legalmoves.concat(rookMovesUsingBitboards(board, index, color))
    // legalmoves = legalmoves.concat(bishopMovesUsingBitboards(board, index, color))

  }


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
      let squareIndex = coordinatesToIndex(coordinate)

      if (!isOutsideBoard(coordinate) && board[squareIndex] * color <= 0) {
        legalmoves.push({
          startSquare: index,
          targetSquare: squareIndex,
          capturePiece: board[squareIndex],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });
      }
    });


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
      let squareIndex = coordinatesToIndex(coordinate)

      if (!isOutsideBoard(coordinate) && board[squareIndex] * color <= 0) {

        legalmoves.push({
          startSquare: index,
          targetSquare: squareIndex,
          capturePiece: board[squareIndex],
          isCastle: false,
          isPromotion: false,
          isEnPassant: false,
        });

      }
    });
  }

  // legal moves for pawn
  else if (piece == 1) {
    if (color * perspective == 1) {
      if (y == 6) {
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
function positionOfKing(board, color) {
  for (let i = 0; i < 64; i++) {
    if (board[i] * color == 2) {
      return i;
    }
  }


}
// //end of the legal moves function
function isUnderCheck(board, color, perspective) {
  var indexOfKing = positionOfKing(board, color);
  for (let i = 0; i < 64; i++) {
    if (board[i] * color < 0) {

      if (
        legalMoves(board, i, -color, perspective).some(
          (obj) => obj.targetSquare === indexOfKing
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function finalLegalMoves(board, index, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack) {
  let legalmoves = legalMoves(board, index, color, perspective);
  let newLegalMoves = [];
  let attacked = attackedSquares(board, -color);
  //special moves
  let check = attacked.includes(positionOfKing(color));

  //Castling
  if (!check) {
    let perspectiveOffset = perspective == 1 ? 0 : -1;
    if (index == 60 + perspectiveOffset && board[index] * perspective == 2) {
      //it may have right to castle
      let shortCastle = perspective == 1 ? whiteCastle[0] : blackCastle[0];
      let longCastle = perspective == 1 ? whiteCastle[1] : blackCastle[1];

      if (
        shortCastle &&
        board[index + perspective] == 0 &&
        board[index + 2 * perspective] == 0 &&
        !attacked.includes(index + perspective)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: index + 2 * perspective,
          capturePiece: 0,
          isCastle: true,
          castleStart: index + 3 * perspective,
          castleEnd: index + perspective,
          isPromotion: false,
          isEnPassant: false,
        });
      }
      if (
        longCastle &&
        board[index - perspective] == 0 &&
        board[index - 2 * perspective] == 0 &&
        board[index - 3 * perspective] == 0 &&
        !attacked.includes(index - perspective)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: index - 2 * perspective,
          capturePiece: 0,
          isCastle: true,
          castleStart: index - 4 * perspective,
          castleEnd: index - perspective,
          isPromotion: false,
          isEnPassant: false,
        });
      }
    }
    if (index == 4 + perspectiveOffset && board[index] * perspective == -2) {
      let shortCastle = perspective == 1 ? blackCastle[0] : whiteCastle[0];
      let longCastle = perspective == 1 ? blackCastle[1] : whiteCastle[1];
      if (
        shortCastle &&
        board[index + perspective] == 0 &&
        board[index + 2 * perspective] == 0 &&
        !attacked.includes(index + perspective)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: index + 2 * perspective,
          capturePiece: 0,
          isCastle: true,
          castleStart: index + 3 * perspective,
          castleEnd: index + perspective,
          isPromotion: false,
          isEnPassant: false,
        });
      }
      if (
        longCastle &&
        board[index - perspective] == 0 &&
        board[index - 2 * perspective] == 0 &&
        board[index - 3 * perspective] == 0 &&
        !attacked.includes(index - perspective)
      ) {
        legalmoves.push({
          startSquare: index,
          targetSquare: index - 2 * perspective,
          capturePiece: 0,
          isCastle: true,
          castleStart: index - 4 * perspective,
          castleEnd: index - perspective,
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
      let c = storeCastlingRights(whiteCastle, blackCastle);
      let e = storeEnPassantRights(enPassantForWhite, enPassantForBlack);
      playMove(board, move, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
      if (isUnderCheck(board, color, perspective)) {
      } else {
        newLegalMoves.push(move);
      }
      unMove(board, move, perspective, c, e, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
    });
    // newLegalMoves = legalmoves;
  } else {
    legalmoves.forEach((move) => {
      let c = storeCastlingRights(whiteCastle, blackCastle);
      let e = storeEnPassantRights(enPassantForWhite, enPassantForBlack);
      playMove(board, move, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
      if (!isUnderCheck(board, color, perspective)) {
        newLegalMoves.push(move);
      } else {
      }
      unMove(board, move, perspective, c, e, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
    });
  }

  return newLegalMoves;
}


function allLegalMoves(board, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack) {
  let data = [];

  for (let i = 0; i < 64; i++) {
    if (board[i] * color > 0) {

      data = data.concat(finalLegalMoves(board, i, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack));
    }
  }
  return data;
}

function playMove(board, move, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack, returnValues) {
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

  checkForCastlingRights(move, whiteCastle, blackCastle, perspective);
  checkForEnPassantRights(board, move.startSquare, move.targetSquare, color, enPassantForWhite, enPassantForBlack, perspective);
  if (returnValues) {
    let oppoentLegalMoves = allLegalMoves(board, -color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
    if (oppoentLegalMoves.length == 0) {
      let check = isUnderCheck(board, -color, perspective);
      if (check) {
        /**checkmate */
        return { gameOver: true, result: "checkmate" }
      }
      else {
        /**stalemat */
        return { gameOver: true, result: "stalemate" }
      }


    }
  }

  return { gameOver: false };
}

function unMove(board, move, perspective, cRights, eRights, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack) {
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

}


function isLegal(board, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack, move) {
  let legalmoves = allLegalMoves(board, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
  let testMove = legalmoves.find(obj => (obj.startSquare == move.startSquare && obj.targetSquare == move.targetSquare))
  if (testMove) {
    return { ok: true, move: pgnMove(board, move, perspective) };
  }

  return { ok: false };

}

function transformMove(move) {
  let newMove = { ...move };
  newMove.startSquare = 63 - move.startSquare;
  newMove.targetSquare = 63 - move.targetSquare;
  if (move.castleStart != undefined) {
    newMove.castleStart = 63 - move.castleStart;
  }
  if (move.castleEnd != undefined) {
    newMove.castleEnd = 63 - move.castleEnd;
  }
  if (move.enPassantSquare != undefined) {
    newMove.enPassantSquare = 63 - move.enPassantSquare;
  }
  return newMove;
}


function Rank(index, perspective) {
  let y = Math.floor(index / 8);
  return perspective == 1 ? 8 - y : y + 1;
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
function decodePieceName(pieceName) {
  switch (pieceName) {
    case "Q":
      return 10;
    case "R":
      return 6;
    case "N":
      return 3;
    case "B":
      return 4;
    case "K":
      return 2;
    case "P":
      return 1;
    case "q":
      return -10;
    case 'r':
      return -6;
    case 'n':
      return -3;
    case 'b':
      return -4;
    case 'k':
      return -2;
    case 'p':
      return -1;
  }
}
function File(index, perspective) {
  let str = "abcdefgh";
  let x = index % 8;

  return perspective == 1 ? str[x] : str[7 - x];
}

function NameSquare(index, perspective) {
  let rank = Rank(index, perspective);
  let file = File(index, perspective);
  return file + rank.toString();
}
function decodeSquareName(algebraicNotation, perspective) {
  let files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  let x = files.indexOf(algebraicNotation[0]);
  let y = 8 - parseInt(algebraicNotation[1]);
  let index = x + 8 * y;
  return perspective == 1 ? index : 63 - index;
}

function simplifyMoveNotation(move, perspective) {
  let notation = "";
  if (move.isCastle) {
    if (move.castleStart == 63) {
      perspective == 1 ? notation += "O-O" : notation += "o-o-o";
    }
    else if (move.castleStart == 56) {
      perspective == 1 ? notation += "O-O-O" : notation += "o-o";
    }
    else if (move.castleStart == 7) {
      perspective == 1 ? notation += "o-o" : notation += "O-O-O";
    }
    else if (move.castleStart == 0) {
      perspective == 1 ? notation += "o-o-o" : notation += "O-O";
    }

    return notation;

  }
  notation += NameSquare(move.startSquare, perspective);
  notation += NameSquare(move.targetSquare, perspective);

  if (move.isPromotion) {
    notation += "P=" + pieceName(move.promotionPiece)
  }
  if (move.isEnPassant) {
    notation += "E=" + NameSquare(move.enPassantSquare, perspective)
  }

  return notation
}


function decodeMoveNotation(notation, perspective) {
  let move = {};
  if (notation == "O-O") {
    if (perspective == 1) {
      return { startSquare: 60, targetSquare: 62, isCastle: true, castleStart: 63, castleEnd: 61 };
    }
    else {
      return { startSquare: 3, targetSquare: 1, isCastle: true, castleStart: 0, castleEnd: 2 }
    }
  }
  else if (notation == 'o-o') {
    if (perspective == 1) {

      return { startSquare: 4, targetSquare: 6, isCastle: true, castleStart: 7, castleEnd: 5 };
    }
    else {
      return { startSquare: 59, targetSquare: 57, isCastle: true, castleStart: 56, castleEnd: 58 };

    }
  }
  else if (notation == 'O-O-O') {
    if (perspective == 1) {
      return { startSquare: 60, targetSquare: 58, isCastle: true, castleStart: 56, castleEnd: 59 };

    }
    else {
      return { startSquare: 3, targetSquare: 5, isCastle: true, castleStart: 7, castleEnd: 4 };

    }
  }
  else if (notation == 'o-o-o') {
    if (perspective == 1) {

      return { startSquare: 4, targetSquare: 2, isCastle: true, castleStart: 0, castleEnd: 3 };
    }
    else {

      return { startSquare: 59, targetSquare: 61, isCastle: true, castleStart: 63, castleEnd: 60 };
    }
  }

  else {
    /**Move is not a castle */

    let startSquare = decodeSquareName(notation[0] + notation[1], perspective);
    let targetSquare = decodeSquareName(notation[2] + notation[3], perspective);

    move.startSquare = startSquare;
    move.targetSquare = targetSquare;

    if (notation.length > 4) {
      if (notation[4] == 'P') {
        /**promotion */
        let promotionPiece = decodePieceName(notation[6]);
        move.isPromotion = true;
        move.promotionPiece = promotionPiece;

      }
      else if (notation[4] == 'E') {
        /**enpassant */
        let enPassantSquare = decodeSquareName(notation[6] + notation[7], perspective);
        move.enPassantSquare = enPassantSquare;
        move.isEnPassant = true;

      }
    }


    return move;



  }
}

function pgnMove(board, move, perspective) {
  let str = "";

  if (move.isCastle) {
    if (move.castleStart == 63) {
      perspective == 1 ? str += "O-O" : str += "o-o-o";
    }
    else if (move.castleStart == 56) {
      perspective == 1 ? str += "O-O-O" : str += "o-o";
    }
    else if (move.castleStart == 7) {
      perspective == 1 ? str += "o-o" : str += "O-O-O";
    }
    else if (move.castleStart == 0) {
      perspective == 1 ? str += "o-o-o" : str += "O-O";
    }

    return str;

  }

  str += pieceName(board[move.startSquare]).toUpperCase();
  if (move.capturePiece || move.isEnPassant) {
    if (Math.abs(board[move.startSquare]) == 1) {
      str += File(move.startSquare, perspective) + 'x';
    }
    else {
      str += 'x';
    }

  }

  str += NameSquare(move.targetSquare, perspective);
  let promotion = "";
  if (move.isPromotion) {
    promotion += ("=" + pieceName(move.promotionPiece).toLowerCase())

  }
  str += promotion;
  if (move.isEnPassant) {
    str += "e.p"
  }


  return str;

}
function decodeGame(game, perspective) {
  let arr = []
  let moves = game.split(" ");
  let len = moves.length
  for (let i = 0; i < len; i++) {
    if (moves[i] == " " || moves[i] == "") {
      continue;
    }
    arr.push(decodeMoveNotation(moves[i], perspective));
  }

  return arr;
}

function boardToFen(board, perspective) {
  let fen = "";
  let emptyStreak = 0;

  for (let i = 0; i < 64; i++) {
    let j = (perspective == 1) ? i : 63 - i;
    if (board[j]) {
      if (emptyStreak) {
        fen += emptyStreak.toString();
        emptyStreak = 0;
      }
      switch (board[j]) {
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
      if (j % 8 == 7) {
        fen += emptyStreak.toString();
        emptyStreak = 0;
      }
    }
  }

  return fen;
}


function reverseString(str) {
  return str.split("").reverse().join('');
}


function decodePGNMove(board, move, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack) {
  // the given move is in the format Nf3 and we need to transform it to form like this g1f3
  if (move == 'O-O' || move == "O-O-O" || move == "o-o" || move == "o-o-o") {
    if (color == 1) {
      return move.toUpperCase()
    }
    return move.toLowerCase();
  }
  let startSquares = [], targetSquare = "";
  let startPiece;
  const targetRegex = /[a-h][1-8]/;
  const targetMatch = move.match(targetRegex);


  const startPieceRegex = /[RNBQK]/
  const startPieceMatch = move.match(startPieceRegex)




  if (targetMatch) {
    targetSquare += targetMatch[0]
  }
  else {
    throw new Error("Invalid pgn: Need to specify the target square")
  }


  if (startPieceMatch) {
    startPiece = decodePieceName(startPieceMatch[0]) * color;
  }
  else {
    startPiece = color;
  }


  let found = false;

  let targetIndex = decodeSquareName(targetSquare, perspective);
  for (let i = 0; i < 64; i++) {
    if (board[i] == startPiece) {
      /*Found the start piece on the board */
      let legal = finalLegalMoves(board, i, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
      let flag = (legal.find(obj => obj.targetSquare == targetIndex))
      //error occures here. We need to check for the other attributes of the obj especially for the castling.

      if (flag) {

        startSquares.push(NameSquare(i, perspective))
        found = true;

      }
    }
  }




  if (!found) {
    console.log("Failed For:", move)
    console.log("Tried for:", startSquares, targetSquare)
    console.log("Player turn", (color == 1 ? "white" : "Black"))

    throw new Error("Couldn't find a startsquare! cross check your code buddy")
  }

  if (startSquares.length > 1) {

    const startFileRegex = /[RNBQK][a-h]/
    const startFileMatch = move.match(startFileRegex)

    const startFileRegex2 = /[a-h][xX]/
    const startFileMatch2 = move.match(startFileRegex2)
    if (startFileMatch) {
      let startFile = startFileMatch[0][1];
      for (let i = 0; i < startSquares.length; i++) {
        if (startSquares[i][0] == startFile) {
          return startSquares[i] + targetSquare
        }
      }
    }
    else if (startFileMatch2) {
      let startFile = startFileMatch2[0][0];
      for (let i = 0; i < startSquares.length; i++) {
        if (startSquares[i][0] == startFile) {
          return startSquares[i] + targetSquare
        }
      }

    }
    else {
      throw new Error(" Ambiguity in the start square. Multiple pieces of same type can move to the same square. Need to specify the file of the start piece!")
    }
  }


  return startSquares[0] + targetSquare;

}



function decodePGNGame(game, perspective) {
  let moves = game.split(" ");

  let decodedGame = []
  let board = startPos(perspective);
  let whiteCastle = [true, true];
  let blackCastle = [true, true];
  let enPassantForWhite = [false, -1]
  let enPassantForBlack = [false, -1]
  let color = 1;

  for (let move of moves) {
    let pgnMove = decodePGNMove(board, move, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack);
    decodedGame.push(pgnMove)
    let m = decodeMoveNotation(pgnMove, perspective);

    playMove(board, m, color, perspective, whiteCastle, blackCastle, enPassantForWhite, enPassantForBlack, false)
    color = -color;
  }

  return { game: decodedGame.join(" "), resultFen: boardToFen(board, perspective) }

}

function decodeFullPGNGame(game, perspective) {
  let d = decodePGNGame(game, perspective);
  return { game: decodeGame(d.game, perspective), resultFen: d.resultFen }
}


function printBoard(board) {
  let str = "";
  for (let i = 0; i < 64; i++) {
    if (board[i] == 1) {
      str += "P  ";
    }
    else if (board[i] == -1) {

      str += "p  ";
    }
    else if (board[i]) {
      str += pieceName(board[i])
      str += "  ";
    }
    else {
      str += ".  "
    }

    if (i % 8 == 7) {
      str += "\n"
    }
  }

  console.log(str)
}

module.exports = { startPos, isLegal, transformMove, playMove, storeCastlingRights, storeEnPassantRights, simplifyMoveNotation, decodeMoveNotation, decodeGame, boardToFen, pgnMove, decodeFullPGNGame }