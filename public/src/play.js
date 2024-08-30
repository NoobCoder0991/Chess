
let loaders = document.getElementsByClassName('loading-animation');
for (let loader of loaders) {

  loader.appendChild(createLoadingAnimation("orange"))
}




const socket = io("/play");




// warningMessage("Error fetching the puzzle!")

var userInfo;

sendPostRequest('/fetch_info', {})
  .then(data => {
    if (data.ok) {
      userInfo = data.userInfo;
      document.getElementById('username').innerHTML = (userInfo.title == "") ? userInfo.username : "<span class='user-title'>" + userInfo.title + "</span> " + userInfo.username;
      let completedGames = userInfo.games;
      let completedGamesLength = completedGames.length
      if (completedGamesLength) {
        for (let i = completedGamesLength - 1; i >= 0; i--) {
          let completedGame = completedGames[i];
          let gameInfo = JSON.parse(completedGame);
          let moveCount = parseInt((gameInfo.game.split(" ").length - 1) / 2)
          let date = gameInfo.date
          let gameElement;
          console.log("gameInfo", gameInfo)

          let winner = gameInfo.winner;

          if (winner == 1) {
            gameElement = createTableRow(gameInfo.winnerUsername, gameInfo.loserUsername, gameInfo.winnerRating, gameInfo.loserRating, moveCount, date, 1, gameInfo.perspective, gameInfo.resultFen, i)
          }
          else if (winner == -1) {
            gameElement = createTableRow(gameInfo.loserUsername, gameInfo.winnerUsername, gameInfo.loserRating, gameInfo.winnerRating, moveCount, date, -1, gameInfo.perspective, gameInfo.resultFen, i)

          }
          else {
            gameElement = createTableRow(gameInfo.winnerUsername, gameInfo.loserUsername, gameInfo.winnerRating, gameInfo.loserRating, moveCount, date, 0, gameInfo.perspective, gameInfo.resultFen, i)

          }
          gameElement.addEventListener('click', e => {

            sendPostRequest('/recape-game', { gameInfo })
              .then(data => {
                if (data.ok) {
                  window.location.href = data.url
                }

              })
          })
          document.getElementsByClassName('table-body')[0].appendChild(gameElement);
          if (i == completedGamesLength - 5) break;

        }
      }


    }
    else {
      warningMessage(data.errMessage)
    }


  })
  .catch(err => {

    console.log(err)
  })



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

let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
sendPostRequest("/fetch-dialy-puzzle", {})
  .then(data => {
    if (data.ok) {

      fen = data.puzzle.game.resultFen
      setupBoard(fen, document.getElementsByClassName("puzzle-board")[0]);
    }
    else {
      setupBoard(fen, document.getElementsByClassName("puzzle-board")[0]);
      warningMessage("Error fetching puzzle from Lichess!")
    }
  })
  .catch(err => {
    console.log("Error", err)
  })



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

  startPiece.style.transform = `translate(${targetRect.left - startRect.left
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

function playOnline() {

  if (userInfo) {

    document.getElementsByClassName('online-searching')[0].style.display = 'flex'
    document.getElementsByClassName('play-options-card-title')[0].style.opacity = 0
    document.getElementsByClassName('play-button')[0].style.opacity = 0
    document.getElementsByClassName('play-button')[1].style.opacity = 0
    document.getElementsByClassName('play-button')[2].style.opacity = 0
    document.getElementsByClassName('play-button')[3].style.opacity = 0

    document.getElementsByClassName("opponent-searching")[0].style.display =
      "block";
    document.getElementsByClassName("profile-name")[0].style.display = "none";

    socket.emit("play-online-request", userInfo);
    socket.on("play-online-responce", (data) => {
      if (data.ok) {

        window.location.href = data.url;
      }
      else {
        warningMessage("Error: " + data.errMessage);
        document.getElementsByClassName('online-searching')[0].style.display = 'none'
        document.getElementsByClassName("opponent-searching")[0].style.display =
          "none";
        document.getElementsByClassName("profile-name")[0].style.display = "flex";
      }
    });
  }
  else {
    warningMessage("Something went wrong! You might need to reload the browser")
  }
}

function cancelOnlineSearch() {
  socket.emit('cancel-online-request', userInfo);
  socket.on('cancel-online-responce', data => {
    if (data.ok) {
      document.getElementsByClassName('online-searching')[0].style.display = 'none'
      document.getElementsByClassName("opponent-searching")[0].style.display =
        "none";
      document.getElementsByClassName("profile-name")[0].style.display = "flex";
      document.getElementsByClassName('play-options-card-title')[0].style.opacity = 1
      document.getElementsByClassName('play-button')[0].style.opacity = 1
      document.getElementsByClassName('play-button')[1].style.opacity = 1
      document.getElementsByClassName('play-button')[2].style.opacity = 1
      document.getElementsByClassName('play-button')[3].style.opacity = 1

    }
    else {
      warningMessage(data.errMessage)

    }
  })

}


function playComputer() {
  socket.emit("play-mycomputer-request", {
    url: window.location.href,
    perspective: 1,
  });
  socket.on("play-mycomputer-responce", (data) => {
    window.location.href = data.url;
  });
}

function playStockfish() {
  socket.emit("play-stockfish-request", window.location.href);
  socket.on("play-stockfish-responce", (data) => {
    window.location.href = data.url;
  });
}

async function sendPostRequest(url, postData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers if needed
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error during POST request:', error);
    // You can handle the error here, e.g., display a message to the user
    throw error; // Rethrow the error to propagate it
  }
}

function warningMessage(warning) {
  document.getElementsByClassName('warning-message-wrapper')[0].style.display = 'flex'
  document.getElementsByClassName('warning-message-text')[0].innerHTML = warning
  setTimeout(() => {
    // document.getElementsByClassName('warning-message-wrapper')[0].style.display = 'none'

  }, 2000)
}

function successMessage(success) {
  document.getElementsByClassName('success-message')[0].innerHTML = success
  document.getElementsByClassName('success-message')[0].style.display = 'flex'
  setTimeout(() => {
    document.getElementsByClassName('success-message')[0].style.display = 'none'

  }, 2000)
}


function makeUserInfoBarGraph(userInfo) {
  if (userInfo.total_games) {
    document.getElementsByClassName('games-played')[0].style.backgroundImage = "linear-gradient(to right, #2c3e50 100%, #333 100%)";
    const percentWon = parseInt((100 * userInfo.games_won) / (userInfo.total_games));
    const percentLost = parseInt((100 * userInfo.games_lost) / (userInfo.total_games));
    const percentDraw = parseInt((100 * userInfo.games_draw) / (userInfo.total_games));

    document.getElementsByClassName('games-won')[0].style.backgroundImage = `linear-gradient(to right, var(--secondary) ${percentWon}%, #333 ${percentWon}%)`;
    document.getElementsByClassName('games-lost')[0].style.backgroundImage = `linear-gradient(to right, var(--accent) ${percentLost}%, #333 ${percentLost}%)`;
    document.getElementsByClassName('games-draw')[0].style.backgroundImage = `linear-gradient(to right, goldenrod ${percentDraw}%, #333 ${percentDraw}%)`;

    for (let i = 0; i <= percentWon; i++) {
      setTimeout(() => {
        document.getElementsByClassName('games-won')[0].style.backgroundImage = `linear-gradient(to right, var(--secondary) ${i}%, #333 ${i}%)`;
      }, i * 5);
    }
    for (let i = 0; i <= percentLost; i++) {
      setTimeout(() => {
        document.getElementsByClassName('games-lost')[0].style.backgroundImage = `linear-gradient(to right, var(--accent) ${i}%, #333 ${i}%)`;

      }, i * 5);
    }
    for (let i = 0; i <= percentDraw; i++) {
      document.getElementsByClassName('games-draw')[0].style.backgroundImage = `linear-gradient(to right, goldenrod ${i}%, #333 ${i}%)`;
      setTimeout(() => {
      }, i * 5);
    }
    for (let i = 0; i <= percentWon; i++) {
      setTimeout(() => {
        document.getElementsByClassName('win-percent')[0].style.backgroundImage = `linear-gradient(to right, dodgerblue ${i}%, #333 ${i}%)`;
      }, i * 5);
    }


  }

}


let settingsShown = false;
function showSettings() {
  if (settingsShown) {
    document.getElementsByClassName('left-slider-options')[0].classList.add('hide')
    document.getElementsByClassName('left-slider-options')[0].classList.remove('showup')
    document.getElementsByClassName('settings')[0].style.transform = `translate(0,0)`

    document.getElementsByClassName('left-slider-options')[0].style.display = 'none'

    settingsShown = false;

  }

  else {

    document.getElementsByClassName('left-slider-options')[0].classList.remove('hide')
    document.getElementsByClassName('left-slider-options')[0].classList.add('showup')
    document.getElementsByClassName('left-slider-options')[0].style.display = 'flex'
    document.getElementsByClassName('settings')[0].style.transform = `translate(-17vw,0)`
    settingsShown = true;
  }

}


function createTableRow(whiteName, blackName, whiteRate, blackRate, moveCount, date, winner, perspective, resutlFen, index) {

  // Create the table row element
  var tableRow = document.createElement("tr");
  tableRow.classList.add("table-row");

  // Create the first table data cell
  var td1 = document.createElement("td");

  // Create the completed game profiles div
  var completedGameProfiles = document.createElement("div");
  completedGameProfiles.classList.add("completed-game-profiles");

  // Create the white profile div
  var whiteProfile = document.createElement("div");
  whiteProfile.classList.add("white-profile");

  // Create the white flag div
  var whiteFlag = document.createElement("div");
  whiteFlag.classList.add("white-flag");
  if (winner == 1) {
    whiteFlag.classList.add("winner-flag");

  }
  else if (winner == -1) {
    whiteFlag.classList.add("loser-flag");

  }

  // Create the white username div
  var whiteUsername = document.createElement("div");
  whiteUsername.classList.add("white-username");
  whiteUsername.textContent = whiteName;

  // Create the white rating div
  var whiteRating = document.createElement("div");
  whiteRating.classList.add("white-rating");
  whiteRating.textContent = "(" + whiteRate + ")";

  // Append elements to white profile
  whiteProfile.appendChild(whiteFlag);
  whiteProfile.appendChild(whiteUsername);
  whiteProfile.appendChild(whiteRating);

  // Create the black profile div
  var blackProfile = document.createElement("div");
  blackProfile.classList.add("black-profile");

  // Create the black flag div
  var blackFlag = document.createElement("div");
  blackFlag.classList.add("black-flag");
  if (winner == 1) {

    blackFlag.classList.add("loser-flag");
  }
  else if (winner == -1) {

    blackFlag.classList.add("winner-flag");
  }

  // Create the black username div
  var blackUsername = document.createElement("div");
  blackUsername.classList.add("white-username");
  blackUsername.textContent = blackName;

  // Create the black rating div
  var blackRating = document.createElement("div");
  blackRating.classList.add("white-rating");
  blackRating.textContent = "(" + blackRate + ")";

  // Append elements to black profile
  blackProfile.appendChild(blackFlag);
  blackProfile.appendChild(blackUsername);
  blackProfile.appendChild(blackRating);

  // Append white and black profiles to completed game profiles
  completedGameProfiles.appendChild(whiteProfile);
  completedGameProfiles.appendChild(blackProfile);

  // Append completed game profiles to table data cell 1
  td1.appendChild(completedGameProfiles);

  // Create the second table data cell
  var td2 = document.createElement("td");

  // Create the completed game result div
  var completedGameResult = document.createElement("div");
  completedGameResult.classList.add("completed-game-result");

  // Create the inner div for result and status
  var resultStatusDiv = document.createElement("div");
  resultStatusDiv.style.cssText = "display: flex;flex-direction: column;justify-content: center;align-items: center;";

  // Create the white result div
  var whiteResult = document.createElement("div");
  whiteResult.classList.add("white-result");
  if (winner == 1) {

    whiteResult.textContent = "1";
  }
  else if (winner == -1) {
    whiteResult.textContent = "0";

  }
  else {

    whiteResult.innerHTML = "&frac12";
  }

  // Create the black result div
  var blackResult = document.createElement("div");
  blackResult.classList.add("black-result");
  if (winner == -1) {

    blackResult.textContent = "1";
  }
  else if (winner == 1) {

    blackResult.textContent = "0";
  }
  else {

    blackResult.innerHTML = "&frac12";
  }

  // Append white and black result to result status div
  resultStatusDiv.appendChild(whiteResult);
  resultStatusDiv.appendChild(blackResult);

  // Create the my status div
  var myStatus = document.createElement("div");
  myStatus.classList.add("status");
  if (winner == perspective) {

    myStatus.classList.add("winner-status");
    myStatus.innerHTML = "<i class='fas fa-plus'></i>";
  }
  else if (winner) {

    myStatus.classList.add("loser-status");
    myStatus.innerHTML = "<i class='fas fa-minus'></i>";
  }
  else {
    myStatus.classList.add("draw-status");
    myStatus.innerHTML = "<i class='fas fa-equals'></i>";

  }

  // Append result status div and my status to completed game result
  completedGameResult.appendChild(resultStatusDiv);
  completedGameResult.appendChild(myStatus);

  // Append completed game result to table data cell 2
  td2.appendChild(completedGameResult);

  // Create the third table data cell
  var td3 = document.createElement("td");

  // Create the completed game accuracy div
  var completedGameAccuracy = document.createElement("div");
  completedGameAccuracy.classList.add("completed-game-accuracy");

  // Create the white accuracy div
  var whiteAccuracy = document.createElement("div");
  whiteAccuracy.classList.add("white-accuracy");
  whiteAccuracy.textContent = "NA";

  // Create the black accuracy div
  var blackAccuracy = document.createElement("div");
  blackAccuracy.classList.add("black-accuracy");
  blackAccuracy.textContent = "NA";

  // Append white and black accuracy to completed game accuracy
  completedGameAccuracy.appendChild(whiteAccuracy);
  completedGameAccuracy.appendChild(blackAccuracy);

  // Append completed game accuracy to table data cell 3
  td3.appendChild(completedGameAccuracy);

  // Create the fourth table data cell
  var td4 = document.createElement("td");
  td4.textContent = moveCount;

  // Create the fifth table data cell
  var td5 = document.createElement("td");
  td5.innerHTML = date;


  var resultBoard = createMiniBoard(resutlFen, perspective)

  // Append table data cells to table row
  tableRow.appendChild(td1);
  tableRow.appendChild(td2);
  tableRow.appendChild(td3);
  tableRow.appendChild(td4);
  tableRow.appendChild(td5);
  tableRow.appendChild(resultBoard)
  tableRow.addEventListener('mouseover', e => {
    resultBoard.style.display = 'flex'
  })
  tableRow.addEventListener('mouseout', e => {
    resultBoard.style.display = 'none'
  })

  // Append table row to table body or any other parent element
  return tableRow;
}


function downloadCompletedGame(format, index) {

  let completedGame = userInfo.games[index];

  let gameInfo = JSON.parse(completedGame)

  let date = gameInfo.date;
  const filename = 'PiChess_' + date + "." + format;
  var heading;
  if (gameInfo.winner == 1) {

    heading = `[Event "Rated PiChess Match"]\n[Date "${date}"]\n[White "${gameInfo.winnerUsername}"]\n[Black "${gameInfo.loserUsername}"]\n[WhiteRating "${gameInfo.winnerRating}"]\n[BlackRating "${gameInfo.loserRating}"]\n[Result "1-0"]\n\n`;
  }
  else if (gameInfo.winner == -1) {
    heading = `[Event "Rated PiChess Match"]\n[Date "${date}"]\n[White "${gameInfo.loserUsername}"]\n[Black "${gameInfo.winnerUsername}"]\n[WhiteRating "${gameInfo.loserRating}"]\n[BlackRating "${gameInfo.winnerRating}"]\n[Result "0-1"]\n\n`;

  }
  else {
    heading = `[Event "Rated PiChess Match"]\n[Date "${date}"]\n[White "${gameInfo.loserUsername}"]\n[Black "${gameInfo.winnerUsername}"]\n[WhiteRating "${gameInfo.loserRating}"]\n[BlackRating "${gameInfo.winnerRating}"]\n[Result "1/2-1/2"]\n\n`;

  }

  let moves;
  if (format == 'pcn') {
    moves = gameInfo.game.split(' ');
  }
  else if (format == 'pgn') {
    moves = gameInfo.pgn.split(" ");
  }
  else {
    throw new Error("Formatting err");
  }
  var gameContent = heading;
  let moveCount = 1;
  for (let i = 0; i < moves.length - 1; i += 2) {
    gameContent += moveCount.toString() + ".";
    gameContent += " ";
    gameContent += moves[i];
    gameContent += " ";
    gameContent += moves[i + 1];
    gameContent += " ";
    moveCount++;

  }


  if (gameInfo.winner == 1) {
    gameContent += `{White wins by ${gameInfo.reason}} 1-0`

  }
  else if (gameInfo.winner == -1) {
    gameContent += `{Black wins by ${gameInfo.reason}} 0-1`
  }
  else {
    gameContent += `{Draw by ${gameInfo.reason}} 1-2-1/2`
  }

  var blob = new Blob([gameContent], { type: "application/octet-stream" });
  var url = URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.href = url;
  a.download = filename + ".pgn";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


function createLoadingAnimation(color) {
  // Create SVG element
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", '-2 -2 54 54');
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "auto");

  // Create mask element
  var mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
  mask.setAttribute("id", "a");

  // Create path elements for the mask
  var pathC = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathC.setAttribute("id", "c");
  pathC.setAttribute("pathLength", "1");
  pathC.setAttribute("fill", "none");
  pathC.setAttribute("stroke", "white");
  pathC.setAttribute("stroke-width", "3.77953");
  pathC.setAttribute("stroke-dasharray", "1");
  pathC.setAttribute("d", "m 21.776255,12.644596 c -1.28368,8.43561 8.943332,12.698588 14.537976,17.606142 3.000307,2.631832 4.41181,4.442404 5.683988,7.930417");
  mask.appendChild(pathC);

  var pathD = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathD.setAttribute("id", "d");
  pathD.setAttribute("pathLength", "1");
  pathD.setAttribute("fill", "none");
  pathD.setAttribute("stroke", "white");
  pathD.setAttribute("stroke-width", "4.15748");
  pathD.setAttribute("stroke-dasharray", "1");
  pathD.setAttribute("d", "M 43.186954,36.323824 C 46.003963,35.12034 49.845597,30.841626 48.627889,28.700886 46.377142,24.744054 39.744879,14.01233 36.740396,8.9693395 36.318664,8.2614666 36.497278,7.1347125 37.33348,5.6694471 38.691731,3.2894037 39.28973,0.04112172 39.28973,0.04112172");
  mask.appendChild(pathD);

  var pathE = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathE.setAttribute("id", "e");
  pathE.setAttribute("pathLength", "1");
  pathE.setAttribute("fill", "none");
  pathE.setAttribute("stroke", "white");
  pathE.setAttribute("stroke-width", "4.53543");
  pathE.setAttribute("stroke-dasharray", "1");
  pathE.setAttribute("d", "m 37.44866,2.1780054 c 0,0 -3.946041,0.6463272 -6.237054,2.2338247 C 30.61178,4.8274635 28.515981,5.2102514 27.315947,5.0506709 9.6798264,2.7054202 -2.2950706,19.131557 2.0819674,32.387483 6.4590053,45.643408 24.623776,57.752215 41.817517,41.053258");
  mask.appendChild(pathE);

  // Create main path element
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("mask", "url(#a)");
  path.setAttribute("fill", color);
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("d", "M38.956.5c-3.53.418-6.452.902-9.286 2.984C5.534 1.786-.692 18.533.68 29.364 3.493 50.214 31.918 55.785 41.329 41.7c-7.444 7.696-19.276 8.752-28.323 3.084C3.959 39.116-.506 27.392 4.683 17.567 9.873 7.742 18.996 4.535 29.03 6.405c2.43-1.418 5.225-3.22 7.655-3.187l-1.694 4.86 12.752 21.37c-.439 5.654-5.459 6.112-5.459 6.112-.574-1.47-1.634-2.942-4.842-6.036-3.207-3.094-17.465-10.177-15.788-16.207-2.001 6.967 10.311 14.152 14.04 17.663 3.73 3.51 5.426 6.04 5.795 6.756 0 0 9.392-2.504 7.838-8.927L37.4 7.171z");

  // Append elements to SVG
  svg.appendChild(mask);
  svg.appendChild(path);

  // Create style elements for animations
  var style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.innerHTML = `
        #c {
            animation: x 2s cubic-bezier(0.417, 0.086, 0.741, 0.452) infinite forwards;
        }

        #d {
            animation: y 2s cubic-bezier(0.333, 0.317, 0.621, 0.661) infinite forwards;
        }

        #e {
            animation: z 2s cubic-bezier(0, 0, 0.431, 1) infinite forwards;
        }

      
      
        @keyframes x {
            0% {
                stroke-dashoffset: 1;
                
            }
            
            17.86% {
                stroke-dashoffset: 0;
               
            }
        }
        
   
        @keyframes y {
            0% {
                stroke-dashoffset: 1;
            }

            17.86% {
                stroke-dashoffset: 1;
            }

            31.43% {
                stroke-dashoffset: 0;
            }
        }

        @keyframes z {
            0% {
                stroke-dashoffset: 1;
            }

            31.43% {
                stroke-dashoffset: 1;
            }

            85% {
                stroke-dashoffset: 0;
            }
        }
    `;
  svg.appendChild(style);

  return svg;
}


function generateBoard(str, perspective) {
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
  let fragments = str.split(" ");

  let i = 0;

  for (char of fragments[0]) {
    if (map.hasOwnProperty(char)) {
      if (perspective == 1) {
        board[i] = map[char];
      } else {
        board[63 - i] = map[char];
      }
      i++;
    } else {
      let num = parseInt(char);

      for (j = 0; j < num; j++) {
        if (perspective == 1) {
          board[i] = 0;
        } else {
          board[63 - i] = 0;
        }
        i++;
      }
    }
  }



  return board;
}
function createMiniBoard(fen, perspective) {

  let board = generateBoard(fen, perspective);

  for (let i = 0; i < 64; i++) {
    let sq = document.getElementsByClassName('mini-square')[i];
    if (board[i]) {
      let piece = document.createElement('img');
      piece.classList.add('mini-piece')
      piece.src = '../../assets/image-files/piece-images/' + board[i] + '.png';

      if (sq.firstChild) {

        sq.removeChild(sq.firstChild);
      }
      sq.appendChild(piece)
    }
    else {
      if (sq.firstChild) {

        sq.removeChild(sq.firstChild);
      }

    }
  }
  return document.getElementsByClassName('mini-board-wrapper')[0].cloneNode(true)

}

function hoverOnCompletedGame(index, gameInfo) {
  let fen = gameInfo.resultFen;

  console.log("fen", fen)
  createMiniBoard(fen, gameInfo.perspective);

  let miniBoard = document.getElementsByClassName('mini-board-wrapper')[0];
  document.getElementsByClassName('table-row')[index].appendChild(miniBoard)
  miniBoard.style.display = 'flex'

}

function logout(user) {
  let htm = user.innerHTML;
  user.innerHTML = "Logging out..."
  user.style.pointerEvents = 'none'

  sendPostRequest("/logout-user", {})
    .then(val => {
      user.style.pointerEvents = 'auto'
      user.innerHTML = htm
      window.location.href = '/logged-out'

    })
    .catch(err => {
      user.style.pointerEvents = 'auto'
      user.innerHTML = htm
      warningMessage("Error happened while logging you out!")
    }
    )
}