// sudoku-game.js

let sudokuCells; // Define globally
let selectedCell = null;
let undoStack = [];
let solutionGrid = []; // Store the solution grid
let hintsUsed = 0; // Keep track of the number of hints used

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Generate the Sudoku grid (empty)
  generateGrid();

  // Now that the grid is generated, add event listeners
  addCellEventListeners();

  // Event listener for 'New Game' button
  document.getElementById('generate-btn').addEventListener('click', function() {
    const difficulty = document.getElementById('difficulty-select').value;
    generateNewGame(difficulty);
  });

  // Event listener for 'Save Game' button
  document.getElementById('save-btn').addEventListener('click', savePuzzle);
  // Event listener for 'Load Game' button
  document.getElementById('load-btn').addEventListener('click', loadPuzzle);
  // Event listener for 'Print' button
  document.getElementById('print-btn').addEventListener('click', function() {
    window.print();
  });

  // Event listener for 'Undo' button
  document.getElementById('undo-btn').addEventListener('click', function() {
    undoLastMove();
  });

  // Event listener for 'Reset' button
  document.getElementById('reset-btn').addEventListener('click', function() {
    resetGame();
  });

  // Event listener for 'Solve Game' button
  document.getElementById('solve-btn').addEventListener('click', function() {
    solveGame();
  });

  // Event listener for 'Hint' button
  document.getElementById('hint-btn').addEventListener('click', function() {
    provideHint();
  });
});

// Function to generate the Sudoku grid
function generateGrid() {
  const gridContainer = document.getElementById('sudoku-grid');
  // Clear any existing grid
  gridContainer.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('sudoku-row');
    for (let col = 0; col < 9; col++) {
      const cellInput = document.createElement('input');
      cellInput.type = 'text';
      cellInput.maxLength = '1';
      cellInput.classList.add('sudoku-cell');
      cellInput.id = 'cell-' + (row * 9 + col);

      // Prevent virtual keyboard from appearing
      cellInput.readOnly = true;
      cellInput.inputMode = 'none';

      // Add event listener for cell selection
      cellInput.addEventListener('click', () => selectCell(cellInput));

      rowDiv.appendChild(cellInput);
    }
    gridContainer.appendChild(rowDiv);
  }
  // Update the sudokuCells NodeList after creating the cells
  sudokuCells = document.querySelectorAll('.sudoku-cell');
}

function addCellEventListeners() {
  // Event listeners for number buttons
  const numberButtons = document.querySelectorAll('.number-btn');
  numberButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (selectedCell && !selectedCell.classList.contains('prefilled-cell')) {
        const number = button.getAttribute('data-number');
        addToUndoStack(selectedCell, number, true); // Indicate number bar input
        selectedCell.value = number;
        // Add the 'number-bar-input' class
        selectedCell.classList.add('number-bar-input');
        // Remove other input-related classes if necessary
        selectedCell.classList.remove('user-input', 'hint-cell', 'correct', 'incorrect');

        // After entering a number, check if the puzzle is complete
        if (isPuzzleComplete()) {
          validateSolution();
        }
      }
    });
  });
}

// Function to handle cell selection
function selectCell(cell) {
  if (selectedCell) {
    selectedCell.classList.remove('selected');
  }
  selectedCell = cell;
  selectedCell.classList.add('selected');
}

// Function to add moves to the undo stack
function addToUndoStack(cell, newValue, enteredViaNumberBar = false) {
  const previousValue = cell.value;
  const previousEnteredViaNumberBar = cell.classList.contains('number-bar-input');
  undoStack.push({
    cell: cell,
    previousValue: previousValue,
    previousEnteredViaNumberBar: previousEnteredViaNumberBar,
    enteredViaNumberBar: enteredViaNumberBar,
    previousClasses: Array.from(cell.classList),
  });
}

// Undo the last move
function undoLastMove() {
  if (undoStack.length > 0) {
    const lastMove = undoStack.pop();
    lastMove.cell.value = lastMove.previousValue;
    // Restore previous classes
    lastMove.cell.className = ''; // Clear all classes
    lastMove.previousClasses.forEach((className) => {
      lastMove.cell.classList.add(className);
    });
    // Remove validation classes if any
    lastMove.cell.classList.remove('correct', 'incorrect');
  }
}

// Function to generate a new game
function generateNewGame(difficulty) {
  clearBoard();
  hintsUsed = 0; // Reset hints used
  document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;

  // Generate a new puzzle using the sudoku library
  const puzzleString = sudoku.generate(difficulty);
  const puzzleArray = convertPuzzleStringToArray(puzzleString);
  populateBoard(puzzleArray);

  // Get the solution and store it
  const solutionString = sudoku.solve(puzzleString);
  solutionGrid = convertPuzzleStringToArray(solutionString);
}

// Function to solve the game
function solveGame() {
  const boardString = getPuzzleState();
  const solutionString = sudoku.solve(boardString);
  if (solutionString) {
    const solutionArray = convertPuzzleStringToArray(solutionString);
    populateBoard(solutionArray, true); // Pass true to indicate solving
    // Update the solutionGrid
    solutionGrid = solutionArray;
  } else {
    alert('No solution found for the current board.');
  }
}

// Function to clear the board
function clearBoard() {
  sudokuCells.forEach((cell) => {
    cell.value = '';
    cell.classList.remove('prefilled-cell', 'user-input', 'number-bar-input', 'correct', 'incorrect', 'hint-cell');
    // Ensure cells remain read-only
    cell.readOnly = true;
  });
}

// Function to populate the board with a puzzle or solution
function populateBoard(puzzleArray, isSolving = false) {
  let index = 0;
  sudokuCells.forEach((cell) => {
    const value = puzzleArray[index];
    if (value !== 0) {
      cell.value = value;
      if (!isSolving) {
        // Cells that are part of the initial puzzle
        cell.classList.add('prefilled-cell');
        cell.classList.remove('user-input', 'number-bar-input', 'hint-cell');
      } else {
        // If solving, don't disable cells, just populate
        if (!cell.classList.contains('prefilled-cell')) {
          cell.classList.add('user-input');
          cell.classList.remove('number-bar-input', 'hint-cell');
        }
      }
    } else {
      if (!isSolving) {
        cell.value = '';
        cell.classList.remove('prefilled-cell', 'user-input', 'number-bar-input', 'hint-cell');
      }
    }
    // Remove validation classes
    cell.classList.remove('correct', 'incorrect');
    index++;
  });
}

// Function to get the current state of the puzzle
function getPuzzleState() {
  let puzzle = '';
  sudokuCells.forEach((cell) => {
    puzzle += cell.value ? cell.value : '.';
  });
  return puzzle;
}

// Function to convert puzzle string to array
function convertPuzzleStringToArray(puzzleString) {
  return puzzleString.split('').map(char => (char === '.' ? 0 : parseInt(char, 10)));
}

// Function to save the puzzle state to local storage
function savePuzzle() {
  const puzzleState = getCurrentPuzzleState();
  localStorage.setItem('savedPuzzle', JSON.stringify(puzzleState));
  alert('Your game has been saved!');
}

// Function to load the puzzle state from local storage
function loadPuzzle() {
  const savedPuzzle = localStorage.getItem('savedPuzzle');
  if (savedPuzzle) {
    const puzzleState = JSON.parse(savedPuzzle);
    loadPuzzleState(puzzleState);
    alert('Your saved game has been loaded!');
  } else {
    alert('No saved game found.');
  }
}

function loadPuzzleState(puzzleState) {
  hintsUsed = puzzleState.hintsUsed || 0;
  solutionGrid = puzzleState.solutionGrid || [];
  document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;
  sudokuCells.forEach((cell, index) => {
    const cellData = puzzleState.cells[index];
    cell.value = cellData.value;
    cell.className = ''; // Reset classes
    cellData.classes.forEach((className) => {
      cell.classList.add(className);
    });
    // Ensure cells remain read-only
    cell.readOnly = true;
  });
}

function getCurrentPuzzleState() {
  let puzzleState = {
    cells: [],
    hintsUsed: hintsUsed,
    solutionGrid: solutionGrid
  };
  sudokuCells.forEach((cell) => {
    const cellData = {
      value: cell.value || '',
      classes: Array.from(cell.classList),
    };
    puzzleState.cells.push(cellData);
  });
  return puzzleState;
}

// Update resetGame function to clear saved puzzle
function resetGame() {
  sudokuCells.forEach((cell) => {
    if (!cell.classList.contains('prefilled-cell')) {
      cell.value = '';
      cell.classList.remove('user-input', 'number-bar-input', 'correct', 'incorrect', 'hint-cell');
    }
  });
  undoStack = [];
  hintsUsed = 0; // Reset hints used
  document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;
  localStorage.removeItem('savedPuzzle');
}

// Function to check if the puzzle is complete
function isPuzzleComplete() {
  for (let cell of sudokuCells) {
    if (cell.value === '') {
      return false;
    }
  }
  return true;
}

// Function to validate the user's solution
function validateSolution() {
  let allCorrect = true;

  sudokuCells.forEach((cell, index) => {
    if (cell.classList.contains('prefilled-cell')) {
      // Skip prefilled cells
      return;
    }
    const userValue = parseInt(cell.value);
    const correctValue = solutionGrid[index];

    // Remove any previous 'correct' or 'incorrect' classes
    cell.classList.remove('correct', 'incorrect');

    if (userValue === correctValue) {
      cell.classList.add('correct');
    } else {
      cell.classList.add('incorrect');
      allCorrect = false;
    }
  });

  if (allCorrect) {
    alert('Congratulations! You have completed the puzzle correctly!\nHints used: ' + hintsUsed);
  } else {
    alert('Some entries are incorrect. Incorrect numbers are highlighted in red.');
  }
}

// Function to provide a hint
function provideHint() {
  if (selectedCell && !selectedCell.classList.contains('prefilled-cell') && selectedCell.value === '') {
    const cellIndex = Array.from(sudokuCells).indexOf(selectedCell);
    const correctValue = solutionGrid[cellIndex];
    if (correctValue) {
      // Add to undo stack
      addToUndoStack(selectedCell, selectedCell.value);
      // Set the cell's value to the correct value
      selectedCell.value = correctValue;
      // Mark the cell as a hint cell
      selectedCell.classList.add('hint-cell');
      // Remove other input-related classes if necessary
      selectedCell.classList.remove('user-input', 'number-bar-input', 'incorrect', 'correct');
      // Increment hintsUsed
      hintsUsed++;
      // Update hints used display
      document.getElementById('hints-used').textContent = 'Hints used: ' + hintsUsed;

      // After providing a hint, check if the puzzle is complete
      if (isPuzzleComplete()) {
        validateSolution();
      }
    }
  } else {
    alert('Please select an empty cell to get a hint.');
  }
}
