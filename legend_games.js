const fs = require("fs");

// Function to read the contents of a .pgn file
function readPGNFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Error reading file:", err);
    return null;
  }
}

// Function to extract individual games from PGN data
function extractGamesFromPGN(pgnData) {
  // Split the PGN data by game separators
  return pgnData.split(/\n\n\[Event/).filter((game) => game.trim().length > 0);
}

// Function to choose a random game from a list of games
function chooseRandomGame(games) {
  return games[Math.floor(Math.random() * games.length)];
}

// Example usage
const filePath =
  "C:/Users/shafa/Desktop/BIG_FOLDER/Chess Pro Test - 3/public/legend_games.pgn";
const pgnData = readPGNFile(filePath);
if (pgnData) {
  const games = extractGamesFromPGN(pgnData);
  if (games.length > 0) {
    const randomGame = chooseRandomGame(games);
    console.log(randomGame);
  } else {
    console.error("No games found in the PGN file.");
  }
}
