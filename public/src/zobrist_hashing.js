/**Zobrist Hashing to store transpositions */

// Define constants
const BOARD_SIZE = 64; // 8x8 chessboard
const NUM_PIECES = 12; // Number of different chess pieces
const RANDOM_NUMBERS = new Array(BOARD_SIZE * NUM_PIECES); // Array to store random numbers

// Initialize random numbers for each square and piece combination
function initializeRandomNumbers() {
  for (let i = 0; i < RANDOM_NUMBERS.length; i++) {
    RANDOM_NUMBERS[i] = generateUniqueRandomNumber();
  }
}

// Function to calculate Zobrist hash of a given chessboard state
function calculateHash(board) {
  let hash = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board[i]) {
      let pieceIndex = getPieceIndex(board[i]);
      hash ^= RANDOM_NUMBERS[i * NUM_PIECES + pieceIndex];
    }
  }
  return hash;
}

// Helper function to get index of piece in RANDOM_NUMBERS array
function getPieceIndex(piece) {
  switch (piece) {
    case 1:
      return 0;
    case 3:
      return 1;
    case 4:
      return 2;
    case 6:
      return 3;
    case 10:
      return 4;
    case 2:
      return 5;
    case -1:
      return 6;
    case -3:
      return 7;
    case -4:
      return 8;
    case -6:
      return 9;
    case -10:
      return 10;
    case 2:
      return 11;
    default:
      return -1;
  }
}

// Example usage

class TranspositionTable {
  constructor() {
    this.table = {};
  }

  // Method to insert a key-value pair into the hashtable
  insert(key, value) {
    this.table[key] = value;
  }

  // Method to retrieve the value associated with a given key
  lookup(key) {
    return this.table[key];
  }
}

initializeRandomNumbers();

function generateUniqueRandomNumber() {
  let randomNumber;
  do {
    randomNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  } while (RANDOM_NUMBERS.includes(randomNumber));
  return randomNumber;
}
