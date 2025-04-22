'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// --- Game Variables ---
var game = null;
var bestScore = 0;
var scoreDiv = document.getElementById('score');
var bestScoreDiv = document.getElementById('bestScore');
var addDiv = document.getElementById('add');
var endDiv = document.getElementById('end');
var size = 4;
var nextId = 1;
var score = 0;

// --- Wallet Variables ---
const connectWalletButton = document.querySelector('.connect-wallet-btn');
const baseChainId = '0x2105'; // 8453 in hex for Base Mainnet
let provider = null;
let signer = null;
let userAddress = null;

// --- Wallet Functions ---
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or another wallet extension!');
        connectWalletButton.textContent = 'Install Wallet';
        connectWalletButton.disabled = true;
        return;
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== parseInt(baseChainId, 16)) {
            try {
                // Try switching to Base Mainnet
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: baseChainId }],
                });
                // Re-initialize provider after network switch
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                userAddress = await signer.getAddress();
                updateButtonConnected();
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    // TODO: Optionally add logic to add the Base network here
                    // using 'wallet_addEthereumChain'
                    alert('Please add the Base network to your wallet manually.');
                }
                console.error('Failed to switch network:', switchError);
                updateButtonSwitchNetwork();
                return; // Stop if switching failed
            }
        } else {
            updateButtonConnected();
        }

        // Listen for account and network changes
        listenForWalletChanges();

    } catch (error) {
        console.error("User rejected connection or error occurred:", error);
        connectWalletButton.textContent = 'Connection Failed';
        alert('Failed to connect wallet. Check console for details.');
    }
}

function updateButtonConnected() {
    if (userAddress) {
        connectWalletButton.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    } else {
         connectWalletButton.textContent = 'Connect Wallet';
    }
     connectWalletButton.disabled = false;
}

function updateButtonSwitchNetwork() {
    connectWalletButton.textContent = 'Switch to Base';
    connectWalletButton.disabled = false; // Allow clicking to switch
}

function disconnectWallet() {
    provider = null;
    signer = null;
    userAddress = null;
    connectWalletButton.textContent = 'Connect Wallet';
    connectWalletButton.disabled = false;
    // TODO: Remove listeners if necessary, though they might handle disconnection gracefully
}

function listenForWalletChanges() {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('Accounts changed:', accounts);
            if (accounts.length === 0) {
                // MetaMask is locked or the user has disconnected all accounts
                disconnectWallet();
            } else {
                // Reconnect with the new account, checking network again
                connectWallet();
            }
        });

        window.ethereum.on('chainChanged', (chainIdHex) => {
            console.log('Network changed to:', chainIdHex);
            if (chainIdHex === baseChainId) {
                // Network is correct, update provider and signer
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                signer.getAddress().then(address => {
                    userAddress = address;
                    updateButtonConnected();
                });
            } else {
                 // Network is incorrect
                 userAddress = null; // Address might be invalid on wrong network
                 signer = null;
                 provider = null; // Or keep provider but mark as wrong network
                 updateButtonSwitchNetwork();
                 alert('Please switch back to the Base network.');
            }
        });
    }
}

// Add listener to the connect button
if (connectWalletButton) {
    connectWalletButton.addEventListener('click', connectWallet);
} else {
    console.error('Connect wallet button not found!');
}

// --- Game Logic Functions (Keep existing game functions below) ---

function initGame() {
  game = Array(size * size).fill(null); // 4 x 4 grid, represented as an array
  initBestScore();
}

function initBestScore() {
  bestScore = localStorage.getItem('bestScore') || 0;
  if(bestScoreDiv) { // Check if element exists before setting
    bestScoreDiv.innerHTML = bestScore;
  } else {
      console.error("bestScoreDiv element not found");
  }
}

function updateDOM(before, after) {
  var newElements = getNewElementsDOM(before, after);
  var existingElements = getExistingElementsDOM(before, after);
  var mergedTiles = getMergedTiles(after);
  removeElements(mergedTiles);
  drawGame(newElements, true);
  drawGame(existingElements);
}

function removeElements(mergedTiles) {
  for (var _iterator = mergedTiles, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var tile = _ref;
    if (!tile || !tile.mergedIds) continue; // Add null check

    var _loop = function _loop() {
      if (_isArray2) {
        if (_i2 >= _iterator2.length) return 'break';
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) return 'break';
        _ref2 = _i2.value;
      }

      var id = _ref2;

      var currentElm = document.getElementById(id);
      if (currentElm) { // Add null check for element
        positionTile(tile, currentElm);
        currentElm.classList.add('tile--shrink');
        setTimeout(function () {
          currentElm.remove();
        }, 100);
      } else {
         console.warn(`Merged tile element with id ${id} not found for removal.`);
      }
    };

    for (var _iterator2 = tile.mergedIds, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      var _ret = _loop();

      if (_ret === 'break') break;
    }
  }
}

function getMergedTiles(after) {
  return after.filter(function (tile) {
    return tile && tile.mergedIds;
  });
}

function getNewElementsDOM(before, after) {
  var beforeIds = before.filter(function (tile) {
    return tile;
  }).map(function (tile) {
    return tile.id;
  });
  var newElements = after.filter(function (tile) {
    return tile && beforeIds.indexOf(tile.id) === -1;
  });
  return newElements;
}

function getExistingElementsDOM(before, after) {
  var beforeIds = before.filter(function (tile) {
    return tile;
  }).map(function (tile) {
    return tile.id;
  });
  var existingElements = after.filter(function (tile) {
    return tile && beforeIds.indexOf(tile.id) !== -1;
  });
  return existingElements;
}

function drawBackground() {
  var tileContainer = document.getElementById('tile-container');
  if (!tileContainer) {
      console.error("Tile container not found!");
      return;
  }
  tileContainer.innerHTML = '';
  for (var i = 0; i < size * size; i++) { // Use size * size instead of game.length if game is sometimes null
    // var tile = game[i]; // We don't need the tile object here
    var tileDiv = document.createElement('div');
    var x = i % size;
    var y = Math.floor(i / size);
    tileDiv.style.top = y * 67.5 + 'px';
    tileDiv.style.left = x * 67.5 + 'px';

    tileDiv.classList.add("background");
    tileContainer.appendChild(tileDiv);
  }
}

function positionTile(tile, elm) {
  var x = tile.index % size;
  var y = Math.floor(tile.index / size);
  elm.style.top = y * 67.5 + 'px';
  elm.style.left = x * 67.5 + 'px';
}

function drawGame(tiles, isNew) {
  var tileContainer = document.getElementById('tile-container');
   if (!tileContainer) {
      console.error("Tile container not found for drawing game!");
      return;
  }
  for (var i = 0; i < tiles.length; i++) {
    var tile = tiles[i];
    if (tile) {
      if (isNew) {
        (function () {
          var tileDiv = document.createElement('div');
          positionTile(tile, tileDiv);
          tileDiv.classList.add('tile', 'tile--' + tile.value);
          // Ensure IDs are unique and valid HTML IDs
          tileDiv.id = 'tile-' + tile.id; // Prefix with 'tile-' to avoid numeric IDs
          setTimeout(function () {
            tileDiv.classList.add("tile--pop");
          }, tile.mergedIds ? 1 : 150);
          // Create a p element for the text content for better structure
          var p = document.createElement('p');
          p.textContent = tile.value;
          tileDiv.appendChild(p);
          // tileDiv.innerHTML = '<p>' + tile.value + '</p>'; // Less safe potentially
          tileContainer.appendChild(tileDiv);
        })();
      } else {
        var currentElement = document.getElementById('tile-' + tile.id); // Use prefixed ID
         if (currentElement) { // Add null check
             positionTile(tile, currentElement);
         } else {
             console.warn(`Existing tile element with id 'tile-${tile.id}' not found for positioning.`);
         }
      }
    }
  }
}

function gameOver() {
  if (!game) return false; // Add check if game is initialized
  if (game.filter(function (number) {
    return number === null;
  }).length === 0) {
    var sameNeighbors = game.find(function (tile, i) {
      if (!tile) return false; // Add check for null tile
      // Check right neighbor
      var isRightSame = false;
      if ((i + 1) % size !== 0) { // Check if not on right edge
          const rightNeighbor = game[i + 1];
          isRightSame = rightNeighbor && tile.value === rightNeighbor.value;
      }
      // Check bottom neighbor
      var isDownSame = false;
      if (i + size < size * size) { // Check if not on bottom edge
          const downNeighbor = game[i + size];
          isDownSame = downNeighbor && tile.value === downNeighbor.value;
      }

      // Original logic had potential issues with boundary checks
      // var isRightSame = game[i + 1] && (i + 1) % 4 !== 0 ? tile.value === game[i + 1].value : false;
      // var isDownSame = game[i + 4] ? tile.value === game[i + 4].value : false;

      if (isRightSame || isDownSame) {
        return true;
      }
      return false;
    });
    return !sameNeighbors;
  }
  return false; // Return false if there are empty cells
}

function generateNewNumber() {
  // 0.9 probability of 2, 0.1 probability of 4
  var p = Math.random() * 100;
  return p <= 90 ? 2 : 4;
}

function addRandomNumber() {
  if (!game) return; // Add check if game is initialized
  // Adds either a 2 or a 4 to an empty position in the game array
  var emptyCells = [];
  for (let i = 0; i < game.length; i++) {
      if (game[i] === null) {
          emptyCells.push(i);
      }
  }
  // var emptyCells = game.map(function (_, index) {
  //   return index;
  // }).filter(function (index) {
  //   return game[index] === null;
  // });

  if (emptyCells.length === 0) {
    return;
  }
  var newPos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  var newObj = {
    id: nextId++,
    index: newPos,
    value: generateNewNumber()
  };
  game[newPos] = newObj; // Directly assign instead of splice if game is array of tiles/null
  // game.splice(newPos, 1, newObj);
}

function getIndexForPoint(x, y) {
  return y * size + x;
}

function reflectGrid(grid) {
  var reflectedGame = Array(size * size).fill(null);
  for (var row = 0; row < size; row++) {
    for (var col = 0; col < size; col++) {
      var index1 = getIndexForPoint(col, row);
      var index2 = getIndexForPoint(size - col - 1, row);
      reflectedGame[index1] = grid[index2];
    }
  }
  return reflectedGame;
}

function rotateLeft90Deg(grid) {
  var rotatedGame = Array(size * size).fill(null);
  for (var row = 0; row < size; row++) {
    for (var col = 0; col < size; col++) {
      var index1 = getIndexForPoint(col, row);
      var index2 = getIndexForPoint(size - 1 - row, col);
      rotatedGame[index1] = grid[index2];
    }
  }
  return rotatedGame;
}

function rotateRight90Deg(grid) {
  var rotatedGame = Array(size * size).fill(null);
  for (var row = 0; row < size; row++) {
    for (var col = 0; col < size; col++) {
      var index1 = getIndexForPoint(col, row);
      var index2 = getIndexForPoint(row, size - 1 - col);
      rotatedGame[index1] = grid[index2];
    }
  }
  return rotatedGame;
}

/*
For any cell whose neighbor to the right is empty, move that cell
to the right. For any cell whose neighbor to the right is equal
to the same value, combine the values together (e.g. 2+2 = 4)
*/
function shiftGameRight(gameGrid) {
  if (!gameGrid) return null;
  // reflect game grid
  var reflectedGame = reflectGrid(gameGrid);
  // shift left
  reflectedGame = shiftGameLeft(reflectedGame);
  // reflect back
  return reflectGrid(reflectedGame);
}

function shiftGameLeft(gameGrid) {
  if (!gameGrid) return null;
  var newGameState = [];
  var totalAdd = 0;
  // for rows
  for (var i = 0; i < size; i++) {
    // for columns
    var firstPos = size * i;
    var lastPos = size + size * i;
    var currentRow = gameGrid.slice(firstPos, lastPos);
    var filteredRow = currentRow.filter(function (tile) {
      return tile; // Keep only non-null tiles
    });

    // Reset merged flags for the row before merging
    filteredRow.forEach(tile => { if (tile) delete tile.mergedIds; });

    // Merge tiles
    for (var j = 0; j < filteredRow.length - 1; j++) {
      if (filteredRow[j].value === filteredRow[j + 1].value) {
        var sum = filteredRow[j].value * 2;
        filteredRow[j] = {
          id: nextId++, // Assign a new ID for the merged tile
          mergedIds: [filteredRow[j].id, filteredRow[j + 1].id],
          value: sum
          // index will be set later when mapping the whole grid
        };
        filteredRow.splice(j + 1, 1); // Remove the merged tile
        score += sum;
        totalAdd += sum;
      }
    }
    // Add nulls back to the end of the row
    while (filteredRow.length < size) {
      filteredRow.push(null);
    };
    newGameState = newGameState.concat(filteredRow);
  }

  if (totalAdd > 0) {
    if (scoreDiv) scoreDiv.innerHTML = score;
    if (addDiv) {
        addDiv.innerHTML = '+' + totalAdd;
        addDiv.classList.add('active');
        setTimeout(function () {
          addDiv.classList.remove("active");
        }, 800);
    }
    if (score > bestScore) {
      localStorage.setItem('bestScore', score);
      initBestScore(); // Update best score display
    }
  }
  return newGameState;
}

function shiftGameUp(gameGrid) {
  if (!gameGrid) return null;
  var rotatedGame = rotateLeft90Deg(gameGrid);
  rotatedGame = shiftGameLeft(rotatedGame);
  return rotateRight90Deg(rotatedGame);
}

function shiftGameDown(gameGrid) {
  if (!gameGrid) return null;
  var rotatedGame = rotateRight90Deg(gameGrid);
  rotatedGame = shiftGameLeft(rotatedGame);
  return rotateLeft90Deg(rotatedGame);
}

// Add event listeners for restart buttons
document.querySelectorAll(".js-restart-btn").forEach(button => {
    button.addEventListener("click", newGameStart);
});
// var buttons = document.querySelectorAll(".js-restart-btn");
// var length = buttons.length;
// for (var i = 0; i < length; i++) {
//   if (document.addEventListener) {
//     buttons[i].addEventListener("click", function () {
//       newGameStart();
//     });
//   } else {
//     buttons[i].attachEvent("onclick", function () {
//       newGameStart();
//     });
//   };
// };

document.addEventListener("keydown", handleKeypress);
document.addEventListener('touchstart', handleTouchStart, { passive: false }); // Use passive: false for preventDefault
document.addEventListener('touchmove', handleTouchMove, { passive: false }); // Use passive: false for preventDefault

var xDown = null;
var yDown = null;

function handleTouchStart(evt) {
    // Don't prevent default here, allow scrolling if not a swipe
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
};

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    // Only process if the swipe is significant enough
    if (Math.abs(xDiff) > 5 || Math.abs(yDiff) > 5) {
       evt.preventDefault(); // Prevent scrolling only when swiping
    }

    // Determine direction after swipe ends (or based on dominant axis)
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // Horizontal swipe
        if (Math.abs(xDiff) < 10) return; // Threshold for horizontal swipe
        if (xDiff > 0) {
            handleMove('left');
        } else {
            handleMove('right');
        }
    } else {
        // Vertical swipe
        if (Math.abs(yDiff) < 10) return; // Threshold for vertical swipe
        if (yDiff > 0) {
             handleMove('up');
        } else {
             handleMove('down');
        }
    }

    // Reset values after processing one swipe
    xDown = null;
    yDown = null;
};

function handleKeypress(evt) {
  // Check if the event target is an input or button, if so, don't trigger game moves
  if (evt.target.tagName === 'INPUT' || evt.target.tagName === 'BUTTON') {
    return;
  }

  var modifiers = evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey;
  var whichKey = evt.which || evt.keyCode;

  if (!modifiers) {
    let direction = null;
    switch (whichKey) {
      case 37: // Left arrow
        direction = 'left';
        break;
      case 38: // Up arrow
        direction = 'up';
        break;
      case 39: // Right arrow
        direction = 'right';
        break;
      case 40: // Down arrow
        direction = 'down';
        break;
    }

    if (direction) {
        evt.preventDefault(); // Prevent page scrolling
        handleMove(direction);
    }
  }
}

// Centralized move handling function
function handleMove(direction) {
    if (!game) return; // Ensure game is initialized
    if (gameOver()) return; // Don't move if game is over

    var prevGame = copyGame(game); // Use a deep copy function if necessary
    var moved = false;

    let shiftedGame = null;
    switch (direction) {
        case 'left':
            shiftedGame = shiftGameLeft(game);
            break;
        case 'up':
            shiftedGame = shiftGameUp(game);
            break;
        case 'right':
            shiftedGame = shiftGameRight(game);
            break;
        case 'down':
            shiftedGame = shiftGameDown(game);
            break;
    }

    if (shiftedGame && !areGridsEqual(prevGame, shiftedGame)) {
        game = shiftedGame;
        moved = true;
    }

    if (moved) {
        // Update indices after shifting
        game = game.map(function (tile, index) {
            if (tile) {
                return _extends({}, tile, {
                    index: index
                });
            } else {
                return null;
            }
        });
        addRandomNumber();
        updateDOM(prevGame, game);
        if (gameOver()) {
            if(endDiv) endDiv.classList.add('active');
            // setTimeout(function () {
            //     if(endDiv) endDiv.classList.add('active');
            // }, 800); // Delay might feel unresponsive
        }
    }
}

// Helper function to check if grids are equal
function areGridsEqual(grid1, grid2) {
    if (!grid1 || !grid2 || grid1.length !== grid2.length) return false;
    for (let i = 0; i < grid1.length; i++) {
        const tile1 = grid1[i];
        const tile2 = grid2[i];
        if ((tile1 === null && tile2 !== null) || (tile1 !== null && tile2 === null)) {
            return false; // One is null, the other isn't
        }
        if (tile1 !== null && tile2 !== null && tile1.value !== tile2.value) {
            return false; // Values differ
        }
        // Add more checks if tile structure is more complex (e.g., comparing IDs if relevant)
    }
    return true;
}

// Helper function to create a copy (adjust if deep copy needed)
function copyGame(grid) {
    if (!grid) return null;
    return grid.map(tile => tile ? _extends({}, tile) : null);
}

function newGameStart() {
  var tileContainer = document.getElementById('tile-container');
  if (tileContainer) tileContainer.innerHTML = ''; // Clear previous tiles
  if (endDiv) endDiv.classList.remove('active');
  score = 0;
  if(scoreDiv) scoreDiv.innerHTML = score;
  nextId = 1; // Reset tile ID counter
  initGame();
  drawBackground();
  // var previousGame = []; // No need for previous game here
  addRandomNumber();
  addRandomNumber();
  updateDOM([], game); // Pass empty array as 'before' state for initial draw
}

// --- Initial Game Start ---
newGameStart();