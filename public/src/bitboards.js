
class Bitboard {
  constructor() {
    this._initializeBitboards();
  }

  _initializeBitboards() {
    this._WhitePawnBitboard = 0x000000000000ff00n; // Starting position of white pawns
    this._WhiteRookBitboard = 0x0000000000000081n; // Starting position of white rooks
    this._WhiteKnightBitboard = 0x0000000000000042n; // Starting position of white knights
    this._WhiteBishopBitboard = 0x0000000000000024n; // Starting position of white bishops
    this._WhiteQueenBitboard = 0x0000000000000010n; // Starting position of the white queen
    this._WhiteKingBitboard = 0x0000000000000008n; // Starting position of the white king

    this._BlackPawnBitboard = 0x00ff000000000000n; // Starting position of black pawns
    this._BlackRookBitboard = 0x8100000000000000n; // Starting position of black rooks
    this._BlackKnightBitboard = 0x4200000000000000n; // Starting position of black knights
    this._BlackBishopBitboard = 0x2400000000000000n; // Starting position of black bishops
    this._BlackQueenBitboard = 0x1000000000000000n; // Starting position of the black queen
    this._BlackKingBitboard = 0x0800000000000000n; // Starting position of the black king
  }

  getWhiteBitBoard() {
    return (
      this._WhiteBishopBitboard |
      this._WhiteKingBitboard |
      this._WhiteKnightBitboard |
      this._WhitePawnBitboard |
      this._WhiteQueenBitboard |
      this._WhiteRookBitboard
    );
  }

  getBlackBitboard() {
    return (
      this._BlackBishopBitboard |
      this._BlackKingBitboard |
      this._BlackKnightBitboard |
      this._BlackPawnBitboard |
      this._BlackQueenBitboard |
      this._BlackRookBitboard
    );
  }

  getBlockerBitboard() {
    return this.getWhiteBitBoard() | this.getBlackBitboard();
  }

  _isValidBitboardName(name) {
    return true;
  }

  getBitBoard(name) {
    if (this._isValidBitboardName(name)) {
      return this[name];
    } else {
      throw new Error("Invalid bitboard name");
    }
  }

  updateBitBoard(name, newBitBoard) {
    if (this._isValidBitboardName(name)) {
      return (this[name] = newBitBoard);
    } else {
      throw new Error("Invalid bitboard name");
    }
  }

  // Add methods to update or manipulate bitboards as needed...
}

function updateBitBoard(board, move, reverse) {
  let piece = decodePieceName(board[move.startSquare]);

  const startMask = BigInt(63 - move.startSquare);
  const targetMask = BigInt(63 - move.targetSquare);
  if (reverse) {
    /**Done after unmoving the move */

    if (move.isCastle) {
      /**Move was a castle */
      let castlePieceName = decodePieceName(board[move.castleStart]);
      let currentBitBoard = bitboard.getBitBoard(
        "_" + castlePieceName + "Bitboard"
      );
      currentBitBoard =
        (currentBitBoard | (1n << BigInt(63 - move.castleStart))) &
        ~(1n << BigInt(63 - move.castleEnd));
      bitboard.updateBitBoard("_" + castlePieceName + "Bitboard", currentBitBoard);
    }
    if (move.isEnPassant) {
      let enPassantPiece = decodePieceName(board[move.enPassantSquare]);
      let enPassantBitboard = bitboard.getBitBoard(
        "_" + enPassantPiece + "Bitboard"
      );
      enPassantBitboard |= 1n << BigInt(63 - move.enPassantSquare);
      bitboard.updateBitBoard(
        "_" + enPassantPiece + "Bitboard",
        enPassantBitboard
      );
    }
    if (move.isPromotion) {
      let currentBitBoard = bitboard.getBitBoard("_" + piece + "Bitboard");
      currentBitBoard = (currentBitBoard |=
        1n << BigInt(63 - move.startSquare));
      bitboard.updateBitBoard("_" + piece + "Bitboard", currentBitBoard);

      let promotedPiece = decodePieceName(move.promotionPiece);
      let promotedPieceBitBoard = bitboard.getBitBoard(
        "_" + promotedPiece + "Bitboard"
      );
      promotedPieceBitBoard &= ~(1n << BigInt(63 - move.targetSquare));
      bitboard.updateBitBoard(
        "_" + promotedPiece + "Bitboard",
        promotedPieceBitBoard
      );
    }

    if (move.capturePiece) {
      /**Move resulted in capture , so need to update the bit boards of the move peice and also the piece which was captured */
      let capturePieceName = decodePieceName(move.capturePiece);
      let capturePieceBitboard = bitboard.getBitBoard(
        "_" + capturePieceName + "Bitboard"
      );
      capturePieceBitboard |= 1n << BigInt(63 - move.targetSquare);
      bitboard.updateBitBoard(
        "_" + capturePieceName + "Bitboard",
        capturePieceBitboard
      );
    }
    if (!move.isPromotion) {
      /*Normal move , only alters one bitboard */
      let currentBitBoard = bitboard.getBitBoard("_" + piece + "Bitboard");
      console.log(currentBitBoard)
      currentBitBoard = (currentBitBoard & ~(1n << targetMask)) | (1n << startMask);
      bitboard.updateBitBoard("_" + piece + "Bitboard", currentBitBoard);
    }

    return;
  }
  /**When the move is played , the bitboards of the corrosponding pieces has to be updated */
  /**Done before playing move */

  if (move.isCastle) {
    /**Move was a castle */
    let castlePieceName = decodePieceName(board[move.castleStart]);
    let currentBitBoard = bitboard.getBitBoard(
      "_" + castlePieceName + "Bitboard"
    );
    currentBitBoard =
      (currentBitBoard & ~(1n << BigInt(63 - move.castleStart))) |
      (1n << BigInt(63 - move.castleEnd));
    bitboard.updateBitBoard("_" + castlePieceName + "Bitboard", currentBitBoard);
  }
  if (move.isEnPassant) {
    /**Move was an enPassant move(rare but can occure, always makes life harder for me!) */
    let enPassantPiece = decodePieceName(board[move.enPassantSquare]);
    let enPassantBitboard = bitboard.getBitBoard(
      "_" + enPassantPiece + "Bitboard"
    );
    enPassantBitboard &= ~(1n << BigInt(63 - move.enPassantSquare));
    bitboard.updateBitBoard(
      "_" + enPassantPiece + "Bitboard",
      enPassantBitboard
    );
  }
  if (move.isPromotion) {
    /**Move was a promotion */
    let currentBitBoard = bitboard.getBitBoard("_" + piece + "Bitboard");
    currentBitBoard = currentBitBoard & ~(1n << BigInt(63 - move.startSquare));
    bitboard.updateBitBoard("_" + piece + "Bitboard", currentBitBoard);

    let promotedPiece = decodePieceName(move.promotionPiece);
    let promotedPieceBitBoard = bitboard.getBitBoard(
      "_" + promotedPiece + "Bitboard"
    );
    promotedPieceBitBoard |= 1n << BigInt(63 - move.targetSquare);
    bitboard.updateBitBoard(
      "_" + promotedPiece + "Bitboard",
      promotedPieceBitBoard
    );
  }
  if (move.capturePiece) {
    /**Move resulted in capture , so need to update the bit boards of the move peice and also the piece which was captured */
    let capturePieceName = decodePieceName(move.capturePiece);
    let capturePieceBitboard = bitboard.getBitBoard(
      "_" + capturePieceName + "Bitboard"
    );
    capturePieceBitboard &= ~(1n << BigInt(63 - move.targetSquare));
    bitboard.updateBitBoard(
      "_" + capturePieceName + "Bitboard",
      capturePieceBitboard
    );
  }
  if (!move.isPromotion) {
    /**Normal move , only alters one bitboard */
    let currentBitBoard = bitboard.getBitBoard("_" + piece + "Bitboard");
    currentBitBoard =
      (currentBitBoard & ~(1n << startMask)) |
      (1n << targetMask);
    bitboard.updateBitBoard("_" + piece + "Bitboard", currentBitBoard);
  }

}

function decodePieceName(piece) {
  switch (piece) {
    case 10:
      return "WhiteQueen";
    case 6:
      return "WhiteRook";
    case 4:
      return "WhiteBishop";
    case 3:
      return "WhiteKnight";
    case 2:
      return "WhiteKing";
    case 1:
      return "WhitePawn";
    case -10:
      return "BlackQueen";
    case -6:
      return "BlackRook";
    case -4:
      return "BlackBishop";
    case -3:
      return "BlackKnight";
    case -2:
      return "BlackKing";
    case -1:
      return "BlackPawn";
  }
}

function generateRookBlockerMask(index) {
  let fileBitboard = 0x0080808080808000n >> BigInt(index % 8);
  let rankBitboard = 0x7e00000000000000n >> BigInt(8 * Math.floor(index / 8));
  b = (fileBitboard | rankBitboard) & ~(1n << BigInt(63 - index));
  return b;
}

function generateBishopBlockerMask(bishopIndex) {
  // Initialize an empty bitmask
  // const edges = [0, 1, 2, 3, 4, 5, 6, 7, 8, 16, 24, 32, 40, 48, 56, 15, 23, 31, 39, 47, 55, 63, 57, 58, 59, 60, 61, 62];
  let topLeftEdges = [0, 1, 2, 3, 4, 5, 6, 7, 8, 16, 24, 32, 40, 48, 56]
  let rightBottomEdges = [7, 15, 23, 31, 39, 47, 55, 63, 56, 57, 58, 59, 60, 61, 62]
  let topRightEdges = [0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63]
  let leftBottomEdges = [0, 8, 16, 24, 32, 40, 48, 56, 57, 58, 59, 60, 61, 62, 63]

  let edges = [
    topLeftEdges, topRightEdges, leftBottomEdges, rightBottomEdges
  ]
  let blockerMask = 0n;

  // Define the board dimensions (assuming a standard 8x8 chessboard)
  const boardSize = 8;
  const boardArea = boardSize * boardSize;

  // Define the directions for diagonal movements
  const directions = [-9, -7, 7, 9]; // up-left, up-right, down-left, down-right

  // Iterate over each direction
  for (const direction of directions) {
    // Calculate the squares along the diagonal
    let currentIndex = bishopIndex;
    while (0 <= currentIndex && currentIndex < boardArea) {
      // Check if the current index is within the same diagonal

      if (edges[directions.indexOf(direction)].includes(currentIndex)) {
        break; // Exit loop if the diagonal is crossed
      }

      // Mark the square as blocked
      blockerMask |= (1n << BigInt(63 - currentIndex));

      // Move to the next square along the diagonal
      currentIndex += direction;
    }
  }

  return blockerMask & ~(1n << BigInt(63 - bishopIndex));
}


// Function to generate permutations of other pieces around a given index for a rook
function generateRookBlockerBoards(index) {
  let rows = [];
  let cols = [];
  let arr = [];
  for (let i = 0n; i <= 0xffn; i++) {
    let row =
      ((i & 0x7en) << BigInt(64 - 8 * (Math.floor(index / 8) + 1))) &
      ~(1n << BigInt(63 - index));
    if (!rows.includes(row)) {
      rows.push(row);
    }
  }

  let columns = helper(8);
  for (let i = 0; i < columns.length; i++) {
    let column =
      ((columns[i] & 0x7fffffffffffff7fn) >> BigInt(index % 8)) &
      ~(1n << BigInt(63 - index));
    if (!cols.includes(column)) {
      cols.push(column);
    }
  }

  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < cols.length; j++) {
      let element = rows[i] | cols[j];
      arr.push(element);
    }
  }


  return arr;
}

function generateBishopBlockerBoards(bishopIndex) {
  let principleDiagonal = principleDiagonalInfo(bishopIndex);

  let arr1 = [];
  let s1 = principleDiagonal.start;
  for (let i = 0; i < Math.pow(2, principleDiagonal.length); i++) {
    let num = 0n;
    let index = BigInt(i);
    let bitPosition = BigInt(63 - s1);

    for (let j = 0; j < principleDiagonal.length; j++) {
      num |= ((index & 1n) << bitPosition);
      index >>= 1n;
      bitPosition -= 9n; // Move to the next diagonal square
    }

    num = ((num & 0x007e7e7e7e7e7e00n) & ~(1n << BigInt(63 - bishopIndex)));
    if (!arr1.includes(num)) {

      arr1.push(num);
    }
  }
  let secondaryDiagonal = secondaryDiagonalInfo(bishopIndex);

  let arr2 = [];
  let s2 = secondaryDiagonal.start;
  for (let i = 0; i < Math.pow(2, secondaryDiagonal.length); i++) {
    let num = 0n;
    let index = BigInt(i);
    let bitPosition = BigInt(63 - s2);

    for (let j = 0; j < secondaryDiagonal.length; j++) {
      num |= ((index & 1n) << bitPosition);
      index >>= 1n;
      bitPosition -= 7n; // Move to the next diagonal square
    }

    num = ((num & 0x007e7e7e7e7e7e00n) & ~(1n << BigInt(63 - bishopIndex)));
    if (!arr2.includes(num)) {

      arr2.push(num);
    }
  }

  let arr = [];
  for (let i = 0; i < arr1.length; i++) {
    for (let j = 0; j < arr2.length; j++) {
      arr.push(arr1[i] | arr2[j]);
    }
  }

  return arr;
}


function principleDiagonalInfo(index) {
  const topEdges = [0, 1, 2, 3, 4, 5, 6, 7, 8, 16, 24, 32, 40, 48, 56];
  const bottomEdges = [56, 57, 58, 59, 60, 61, 62, 63, 7, 15, 23, 31, 39, 47, 55]
  let start = index, end = index;
  let length = 0;
  while (!topEdges.includes(start)) {

    start -= 9;
    length++;
  }


  while (!bottomEdges.includes(end)) {
    end += 9;
    length++;
  }

  return { start, length }
}

function secondaryDiagonalInfo(index) {
  const rightEdges = [0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63]
  const leftEdges = [0, 8, 16, 24, 32, 40, 48, 56, 57, 58, 59, 60, 61, 62, 63]


  let start = index, end = index;
  let length = 0;
  while (!rightEdges.includes(start)) {

    start -= 7;
    length++;
  }

  while (!leftEdges.includes(end)) {
    end += 7;
    length++;
  }

  return { start, length }
}



// Function to check if two positions are adjacent on the chessboard
function isAdjacent(position1, position2) {
  const boardSize = 8;
  const rowDiff = Math.abs(Math.floor(position1 / boardSize) - Math.floor(position2 / boardSize));
  const colDiff = Math.abs((position1 % boardSize) - (position2 % boardSize));
  return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff !== 0);
}

function printFormattedString(arr) {
  try {
    let text = ''
    for (let i = 0; i < arr.length; i++) {
      if (i % 8 == 0) {
        text += '\n';
      }

      text += (arr[i] + ' ')
    }

    text += '\n'
    console.log(text)
  }

  catch {
    throw new Error("String is not formatabble")
  }


}

function generateBishopMoveBoard(blockerBoard, blockermask, index) {
  let moveBoard = blockermask & ~blockerBoard;

  let str = toBinaryStringWithLeadingZeros(
    moveBoard.toString(2)
  );

  let strArray = str.split("");

  let topLeftEdges = [0, 1, 2, 3, 4, 5, 6, 7, 8, 16, 24, 32, 40, 48, 56]
  let rightBottomEdges = [7, 15, 23, 31, 39, 47, 55, 63, 56, 57, 58, 59, 60, 61, 62]
  let topRightEdges = [0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63]
  let leftBottomEdges = [0, 8, 16, 24, 32, 40, 48, 56, 57, 58, 59, 60, 61, 62, 63]

  let topLeft = index;
  while (!topLeftEdges.includes(topLeft + 9)) {
    if (strArray[topLeft] == "0" && topLeft != index) {
      let temp = topLeft;
      while (!topLeftEdges.includes(temp)) {
        strArray[temp] = "0";
        temp -= 9;
      }
      strArray[topLeft] = "1";
      break;
    }
    topLeft -= 9;
  }

  let topRight = index;
  while (!topRightEdges.includes(topRight + 7)) {
    if (strArray[topRight] == "0" && topRight != index) {
      let temp = topRight;
      while (!topRightEdges.includes(temp)) {
        strArray[temp] = "0";
        temp -= 7;
      }
      strArray[topRight] = "1";
      break;
    }
    topRight -= 7;
  }

  let bottomLeft = index;
  while (!leftBottomEdges.includes(bottomLeft - 7)) {
    if (strArray[bottomLeft] == "0" && bottomLeft != index) {
      let temp = bottomLeft;
      while (!leftBottomEdges.includes(temp)) {
        strArray[temp] = "0";
        temp += 7;
      }
      strArray[bottomLeft] = "1";
      break;
    }
    bottomLeft += 7;
  }

  let bottomRight = index;

  while (!rightBottomEdges.includes(bottomRight - 9)) {
    if (strArray[bottomRight] == "0" && bottomRight != index) {
      let temp = bottomRight;
      while (!rightBottomEdges.includes(temp)) {
        strArray[temp] = "0";
        temp += 9;
      }
      strArray[bottomRight] = "1";
      break;
    }
    bottomRight += 9;
  }

  return BigInt("0b" + strArray.join(""));
}



function generateRookMoveBoard(blockerBoard, blockermask, index) {
  let moveBoard = blockermask & ~blockerBoard;

  let str = toBinaryStringWithLeadingZeros(
    moveBoard.toString(2).padStart(64, "0")
  );
  let strArray = str.split("");

  let top = index - 8;
  while (top >= 0 && top < 64) {
    if (strArray[top] == "0") {
      let temp = top;
      while (temp >= 0 && temp < 64) {
        strArray[temp] = "0";
        temp -= 8;
      }
      strArray[top] = "1";
      break;
    }
    top -= 8;
  }

  let bottom = index + 8;
  while (bottom >= 0 && bottom < 64) {
    if (strArray[bottom] == "0") {
      let temp = bottom;
      while (temp >= 0 && temp < 64) {
        strArray[temp] = "0";
        temp += 8;
      }
      strArray[bottom] = "1";
      break;
    }
    bottom += 8;
  }

  let left = index - 1;
  while (left % 8 != 7 && left >= 0 && left < 64) {
    if (strArray[left] == "0") {
      let temp = left;
      while (temp % 8 != 7 && temp >= 0 && temp < 64) {
        strArray[temp] = "0";
        temp -= 1;
      }
      strArray[left] = "1";
      break;
    }
    left -= 1;
  }

  let right = index + 1;
  while (right % 8 != 0 && right >= 0 && right < 64) {
    if (strArray[right] == "0") {
      let temp = right;
      while (temp % 8 != 0 && temp >= 0 && temp < 64) {
        strArray[temp] = "0";
        temp += 1;
      }
      strArray[right] = "1";
      break;
    }
    right += 1;
  }

  return BigInt("0b" + strArray.join(""));
}

function generateMagicNumbers() {
  let magicNumbers = [];
  let shift_indices = [];
  for (let i = 0; i < 64; i++) {
    console.log("Trying for i = " + i)
    let rookBlockerBoards = generateRookBlockerBoards(i);
    while (true) {
      let indices = [];
      let magic = tryMagic();
      let magicData;

      /**Got a test magic number! */
      let shift_index;
      let found;


      for (shift_index = 0; shift_index < 64; shift_index++) {
        found = true;
        for (let j = 0; j < rookBlockerBoards.length; j++) {
          magicData = findMagicData(
            magic,
            shift_index,
            rookBlockerBoards[j],
            indices
          );

          if (!magicData) {
            found = false;
            break;
          }
        }

        if (found) break;
      }

      if (found) {


        console.log("Found magic number for i = " + i, "magic:", magic)
        magicNumbers.push(magic);
        shift_indices.push(shift_index);
        break;
      }
    }
  }

  return [magicNumbers, shift_indices];
}

function findMagicData(magic, shift_index, rookBlockerBoard, indices) {
  let product = (magic * rookBlockerBoard) & 0xffffffffffffffffn;

  let index = product >> BigInt(shift_index);
  if (index <= 10000 && !indices.includes(index)) {
    indices.push(index);
    return { magic, index };
  }

  return null;
}

// Usage example:

function helper(cols) {
  if (cols == 1) {
    return [0x80n, 0n];
  }

  let n1 = 0x8000000000000000n >> BigInt(8 * (8 - cols)),
    n2 = 0n;

  let temp = helper(cols - 1);
  let arr = [];
  for (let i = 0; i < temp.length; i++) {
    arr.push(temp[i] | n1);
    arr.push(temp[i] | n2);
  }

  return arr;
}

function generateRandom64BitBigInt() {
  // Generate two random 32-bit integers
  const lower = Math.floor(Math.random() * 0xffffffff);
  const upper = Math.floor(Math.random() * 0xffffffff);

  // Convert the integers to BigInt and combine them into a 64-bit BigInt
  const randomBigInt = (BigInt(upper) << 32n) | BigInt(lower);

  return randomBigInt;
  // return BigInt(Math.floor(Number.MAX_SAFE_INTEGER * Math.random()))
}

function tryMagic() {
  return generateRandom64BitBigInt();
}

function printBitboard(bitboard) {
  let str = toBinaryStringWithLeadingZeros(bitboard);
  let formattedString = "";

  for (let i = 0; i < str.length; i++) {
    formattedString += str[i] + " ";
    if (i % 8 == 7) {
      formattedString += "\n";
    }
  }

  console.log(formattedString);
}

function toBinaryStringWithLeadingZeros(bigInt) {
  var binaryString = bigInt.toString(2);
  var leadingZeros = "0".repeat(64 - binaryString.length);
  return leadingZeros + binaryString;
}

class Rook {
  constructor() {
    this.blockermasks = new Array(64);
    this.blockerBoards = {};
    this.moveBoards = {};
    this.legalMoves = {};
  }
}

class Bishop {
  constructor() {
    this.blockermasks = new Array(64);
    this.blockerBoards = {};
    this.moveBoards = {};
    this.legalMoves = {};
  }
}

const rook = new Rook();
const bishop = new Bishop();

const RookMoves = new Array(64);
const BishopMoves = new Array(64);

let rookMagicNumbers = [16524618453856211166n, 1451668511353402564n, 4745438988781921334n, 13693934794794615810n, 5600584177190259482n, 12607696800710922054n, 11168057394559295662n, 5956057073792100926n, 17568043039664702899n, 16974262240109714090n, 10162077944792371463n, 11722305130264504474n, 16433786174059614942n, 10279023664669933010n, 9347496498472183420n, 3762306639652213678n, 17942327845944621842n, 1147451295084039370n, 2720031786661640926n, 12819727642158656622n, 8544726796192286520n, 15945210302253801267n, 15857423393804903001n, 17178505280001095662n, 14860980580191570147n, 13924477256465891945n, 16694097382345688508n, 7099176327661047532n, 18073928302269186118n, 14123321045071257343n, 7203708970124579595n, 6822395059522280528n, 1892035206030880810n, 13309019355366787145n, 15645703438211509064n, 8666137385533301422n, 8779620057245433839n, 18353525093628843252n, 546547727608977357n, 3798453883736724971n, 18363552109611424714n, 13397350347191186398n, 7903832768578160113n, 6108615567934758673n, 14299076114660050300n, 6520732368422630111n, 2772750671233924249n, 861480082790757807n, 4584076186371584258n, 13039935985995461064n, 14929444501672278370n, 728416023155037671n, 3665088768636079813n, 16484396392455144327n, 10749662975718562869n, 10839317419056035242n, 17562975424696635244n, 5448522739159705812n, 1751749126364629491n, 3059241417284804055n, 17066488107454542314n, 6629273938332255296n, 10873118668636189940n, 8741877732212542179n]
let bishopMagicNumbers = [11863748893952992351n, 18412267857442289897n, 4698414967439986961n, 3825158127938994325n, 16309571212265136172n, 5589682800482681745n, 518345247305271704n, 9802322225272033402n, 12214120913429090833n, 7459656845509003796n, 18416494059809947410n, 6332736225887130865n, 6461008160072210939n, 5846719470692836231n, 10083596129851027499n, 2877996841369083380n, 15340194234496327686n, 14393724526289479791n, 6561606531468161278n, 15576415112128545205n, 13163260920724423244n, 17671325187006104022n, 7388263221220066555n, 10493641155573121853n, 6129585408911353883n, 15088009075023249535n, 17943363944181694590n, 13836540473006640134n, 16544000445429907576n, 9160412937280569521n, 2679962332872368703n, 4028828350801018962n, 698106591883830047n, 2418574693025203043n, 2261951169414873415n, 6287271572278347281n, 17512601551330415650n, 13830702359834009667n, 12024684622989484773n, 10306079504631971904n, 2813826109298271247n, 765619264993428973n, 9228042557169342895n, 10466658006384158861n, 7980727909704279879n, 6918314636526827524n, 14270494669425088591n, 3821953577692660338n, 1770655005261579291n, 6662609667896247572n, 757682396241219401n, 11297737131186981230n, 18336901253968737037n, 7347341661630437576n, 5132358936671383665n, 585919582514006089n, 14129226830401766276n, 13749948437011370041n, 5746701246073696746n, 14474579154599158633n, 1855940978276926939n, 1262064736270949474n, 4468802631022488248n, 2883159058083780661n]
for (let i = 0; i < 64; i++) {
  rook.blockermasks[i] = generateRookBlockerMask(i);
  let blockerBoards = generateRookBlockerBoards(i);
  rook.blockerBoards[i] = blockerBoards;
}

for (let i = 0; i < 64; i++) {
  let blockerboards = rook.blockerBoards[i];
  let arr = [];
  for (let j = 0; j < blockerboards.length; j++) {
    let moveBoard = generateRookMoveBoard(blockerboards[j], rook.blockermasks[i], i)
    arr.push(extractLegalMovesAlt(moveBoard, i));
  }

  rook.moveBoards[i] = arr;
}


for (let i = 0; i < 64; i++) {
  let obj = {};
  let blockerBoards = rook.blockerBoards[i];
  let moveBoards = rook.moveBoards[i];

  for (let j = 0; j < blockerBoards.length; j++) {
    let index = ((rookMagicNumbers[i] * blockerBoards[j]) & 0xffffffffffffffffn) >> 50n;

    obj[`${index}`] = moveBoards[j];
  }

  // rook.legalMoves[i] = obj;
  RookMoves[i] = obj;
}

/**For bishop */


for (let i = 0; i < 64; i++) {
  bishop.blockermasks[i] = generateBishopBlockerMask(i);
  let blockerBoards = generateBishopBlockerBoards(i);
  bishop.blockerBoards[i] = blockerBoards;
}

for (let i = 0; i < 64; i++) {
  let blockerboards = bishop.blockerBoards[i];
  let arr = [];
  for (let j = 0; j < blockerboards.length; j++) {
    let moveBoard = generateBishopMoveBoard(blockerboards[j], bishop.blockermasks[i], i);
    arr.push(extractLegalMovesAlt(moveBoard, i))

  }

  bishop.moveBoards[i] = arr;
}


for (let i = 0; i < 64; i++) {
  let obj = {};
  let blockerBoards = bishop.blockerBoards[i];
  let moveBoards = bishop.moveBoards[i];

  for (let j = 0; j < blockerBoards.length; j++) {
    let index = ((bishopMagicNumbers[i] * blockerBoards[j]) & 0xffffffffffffffffn) >> 50n;

    obj[`${index}`] = moveBoards[j];
  }

  // bishop.legalMoves[i] = obj;

  BishopMoves[i] = obj;
}



function extractLegalMovesAlt(moveBoard, index) {
  let legalMoves = [];
  let position = 0; // Start from the 0th position

  // Loop through each bit of the 64-bit integer
  while (moveBoard !== 0n) {
    // Check if the current bit is set (equals to 1)
    if (moveBoard & 1n) {
      // If set, add the position to the legal moves array
      legalMoves.push({ startSquare: index, targetSquare: 63 - position, isCastle: false, isEnPassant: false, isPromotion: false });
    }

    // Shift the bitboard to the right by 1 (moving to the next bit)
    moveBoard = moveBoard >> 1n;
    position++; // Move to the next position
  }

  return legalMoves;
}

