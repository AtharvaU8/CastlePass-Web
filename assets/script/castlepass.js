var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
  pieceTheme: "assets/img/chesspieces/wikipedia/{piece}.png"  
};
board = Chessboard('myBoard', config);

// Generate Secure Password using chess moves played between user and bot
function generateSecurePassword(moves) {
  // Combine moves into a single string
  const combinedMoves = moves.join("");

  // Generate a deterministic string with added complexity
  const salt = 'chess_salt_2025'; // Fixed salt for consistency across sessions
  const inputString = `${salt}${combinedMoves}${salt}`;

  // Convert to hashed password
  return hashPassword(inputString);
}

// Hashing function
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Convert hash to alphanumeric with symbols, numbers, and uppercase letters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  const hashedPassword = hashArray
    .map(b => characters[b % characters.length])
    .join('');

  return hashedPassword;
}

const generatePasswordButton = document.getElementById('generate');
// Generate and display password
generatePasswordButton.addEventListener('click', async () => {
  const allMoves = [...userMoves, ...botMoves];
  showInput();
  // Generate hashed password
  const hashedPassword = await generateSecurePassword(allMoves);
  
  
  // Apply specific styles for elements
  const passwordDisplay = document.querySelector('.password');

  if (passwordDisplay) {
    passwordDisplay.value = `${hashedPassword}`;
  }
});

function showInput() {
    let pass = document.querySelector(".password");
    let showIcon = document.querySelector("#showInput");
    if (pass.type === "password") {
      showIcon.className = "fa-regular fa-eye-slash ";
      pass.type = "text";
    
    } else {
      showIcon.className = "fa-regular fa-eye";
      pass.type = "password";
    }
}
document.querySelector("#showInput").addEventListener("click", showInput)

// Function to copy text using a hidden <textarea>
function fallbackCopyTextToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to the bottom of the page
    textarea.style.opacity = '0'; // Make it invisible
    textarea.style.pointerEvents = 'none'; // Disable interactions
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        // console.log('Copied to clipboard using fallback!');
    } catch (err) {
        // console.log('Fallback: Unable to copy to clipboard', err);
    }

    document.body.removeChild(textarea);
}

function copyStyleIcon(copy, copied) {
  const copiedicon = document.querySelector(copied);
  const copyicon = document.querySelector(copy);

  copiedicon.style.display = "block";
  copyicon.style.display = "none";

  setTimeout(() => {
    copiedicon.style.display = "none";
    copyicon.style.display = "block";
  }, 5000);
}



// Copy password with fallback
const copyPasswordButton = document.querySelector('.copyPassword');

copyPasswordButton.addEventListener('click', () => {
    const hashedPassword = document.querySelector(".password").value;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        // Use Clipboard API
        navigator.clipboard.writeText(hashedPassword)
            .then(() => {
                copyStyleIcon('#copypassicon', '#copiedpassicon');
            })
            .catch((err) => {
                // console.log('Clipboard API failed, using fallback:', err);
                // Use fallback
                fallbackCopyTextToClipboard(hashedPassword);
                copyStyleIcon('#copypassicon', '#copiedpassicon');
            });
    } else {
        // Use fallback
        fallbackCopyTextToClipboard(hashedPassword);
        copyStyleIcon('#copypassicon', '#copiedpassicon');
    }
});

// Copy user and bot moves (game notation) with fallback
function copyGameNotation() {
    // Get all moves in Standard Algebraic Notation (SAN)
    const moves = game.history({ verbose: true });
    let notationList = '';

    // Format moves in pairs (1.e4 e5, 2.Nf3 Nc6, etc.)
    for (let i = 0; i < moves.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = moves[i].san;
        const blackMove = moves[i + 1] ? moves[i + 1].san : ''; // Check if black move exists
        notationList += `${moveNumber}. ${whiteMove} ${blackMove}\n`;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        // Use Clipboard API
        navigator.clipboard.writeText(notationList)
            .then(() => {
                copyStyleIcon('#copyicon', '#copiedicon');
            })
            .catch((err) => {
                // console.log('Clipboard API failed, using fallback:', err);
                // Using fallback to copy chess moves
                fallbackCopyTextToClipboard(notationList);
                copyStyleIcon('#copyicon', '#copiedicon');
            });
    } else {
        // Use fallback
        fallbackCopyTextToClipboard(notationList);
        copyStyleIcon('#copyicon', '#copiedicon');
    }
}

// Attach event listener for the "Copy Moves" button
document.getElementById("copyMovesButton").addEventListener("click", copyGameNotation);




let moveCount = 0;
const minMoves = 4;
const maxMoves = 16;

document.getElementById("generate").disabled = true;
document.getElementById("undoBtn").disabled = true;
document.getElementById("redoBtn").disabled = true;
document.getElementById('copyMovesButton').disabled = true;

// reset function it is called whenever user clicks the encrypt or decrypt button
function resetAll() {

  // Reset board state
  game.reset();
  $board.find('.' + squareClass).removeClass('highlight-white');
  $board.find('.' + squareClass).removeClass('highlight-black');
  $board.find('.' + squareClass).removeClass('highlight-hint');
  board.position(game.fen());
  globalSum = 0;
  moveCount = 0;
  userMoves = [];
  botMoves = [];
 
  $('#advantageColor').text('Neither side');
  $('#advantageNumber').text(globalSum);

  const passwordDisplay = document.querySelector('.password');
  passwordDisplay.value = 'Generated Password';


  // Disable buttons (if any are active)
  document.getElementById("copyMovesButton").disabled = true;
  document.getElementById("generate").disabled = true;
  document.getElementById("undoBtn").disabled = true;
  document.getElementById("redoBtn").disabled = true;
  document.getElementById('copyMovesButton').disabled = true;

}

// Check if we can proceed with encryption/decryption based on move count
// Function to check move count and update UI accordingly
function onMove() {
    moveCount+=1;
    // console.log("move:",moveCount)
    if (moveCount === minMoves) {
        // Enable encryption and decryption buttons
        document.getElementById("generate").disabled = false;
        document.getElementById('copyMovesButton').disabled = false;
    }
    if (moveCount === 1) {
      document.getElementById("undoBtn").disabled = false;
      document.getElementById("redoBtn").disabled = false;
    }
    
    if (moveCount >= maxMoves) {
        
        setTimeout(() => {
            makePiecesUndraggable();
        }, 300);
        
    }
    
}

// Disable the board to prevent further moves
// Function to make pieces undraggable
function makePiecesUndraggable() {

  board = Chessboard('myBoard', {
  position: board.fen(), // retain the current position
  draggable: false,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
  pieceTheme: "assets/img/chesspieces/wikipedia/{piece}.png" 
  });
  // console.log('board disabled')
}

// popup text
function popup(x) {
  const element = document.getElementById(x);
  if (element) {
    element.style.display = "block"; 
    element.style.animation = "fadeIn 0.5s";
  }
}

// Use an anonymous function to call `popup()` only when the event is triggered
document.querySelector(".copyMoves").addEventListener("mouseover", () => popup("copypopup"));

function popout(x) {
  const element = document.getElementById(x);
  if (element) {
    element.style.display = "none";
    element.style.animation = "fadeOut 0.5s";
  }
}

document.querySelector(".copyMoves").addEventListener("mouseout", () => popout("copypopup"));

//faq
// Wait until DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Select all FAQ question elements
  const faqItems = document.querySelectorAll(".faq-item");

  // Toggle expand/collapse on click
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  });
});


// ui for navbar
const menu = document.querySelector(".menu-btn i").addEventListener("click", () => {
  document.querySelector(".navbar .menu").classList.toggle("active");
  document.querySelector(".menu-btn i").classList.toggle("active");
  document.querySelector(".navbar .max-width .menu .inaclogo").classList.toggle("aclogo");
});
