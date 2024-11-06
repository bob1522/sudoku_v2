// sudoku-game.js

let sudokuCells; // Define globally
let selectedCell = null;
let undoStack = [];
let solutionArray = []; // Store the solution grid globally

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

        // Remove 'correct' and 'incorrect' classes
        selectedCell.classList.remove('correct', 'incorrect');

        addToUndoStack(selectedCell, number, true); // Indicate number bar input
        selectedCell.value = number;
        // Add the 'number-bar-input' class
        selectedCell.classList.add('number-bar-input');
        // Remove other input-related classes if necessary
        selectedCell.classList.remove('user-input');

        // Deselect the cell after input
        selectedCell.classList.remove('selected');
        selectedCell = null;

        // After entering the number, check if the puzzle is complete
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
    enteredViaNumberBar: enteredViaNumberBar
  });
}

// Undo the last move
function undoLastMove() {
  if (undoStack.length > 0) {
    const lastMove = undoStack.pop();
    lastMove.cell.value = lastMove.previousValue;
    // Update classes based on the previous value
    if (lastMove.previousValue) {
      if (lastMove.previousEnteredViaNumberBar) {
        lastMove.cell.classList.add('number-bar-input');
        lastMove.cell.classList.remove('user-input');
      } else {
        lastMove.cell.classList.add('user-input');
        lastMove.cell.classList.remove('number-bar-input');
      }
    } else {
      lastMove.cell.classList.remove('number-bar-input');
      lastMove.cell.classList.remove('user-input');
    }
    // Remove 'correct' and 'incorrect' classes
    lastMove.cell.classList.remove('correct', 'incorrect');
  }
}

// Function to generate a new game
function generateNewGame(difficulty) {
  clearBoard();
  // Generate a new puzzle using the sudoku library
  const puzzleString = sudoku.generate(difficulty);
  const puzzleArray = convertPuzzleStringToArray(puzzleString);
  
  // Store the solution
  const solutionString = sudoku.solve(puzzleString);
  if (solutionString) {
    solutionArray = convertPuzzleStringToArray(solutionString);
  } else {
    alert('No solution found for the generated puzzle.');
    return;
  }

  populateBoard(puzzleArray);
}

// Function to solve the game
function solveGame() {
  const boardString = getPuzzleState();
  const solutionString = sudoku.solve(boardString);
  if (solutionString) {
    solutionArray = convertPuzzleStringToArray(solutionString);
    populateBoard(solutionArray, true); // Pass true to indicate solving
  } else {
    alert('No solution found for the current board.');
  }
}

// Function to clear the board
function clearBoard() {
  sudokuCells.forEach((cell) => {
    cell.value = '';
    cell.classList.remove('prefilled-cell', 'user-input', 'number-bar-input', 'correct', 'incorrect');
    // Ensure cells remain read-only
    cell.readOnly = true;
  });
  undoStack = [];
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
        cell.classList.remove('user-input', 'number-bar-input');
      } else {
        // If solving, don't disable cells, just populate
        if (!cell.classList.contains('prefilled-cell')) {
          cell.classList.add('user-input');
          cell.classList.remove('number-bar-input');
        }
      }
    } else {
      if (!isSolving) {
        cell.value = '';
        cell.classList.remove('prefilled-cell', 'user-input', 'number-bar-input');
      }
    }
    // Remove 'correct' and 'incorrect' classes
    cell.classList.remove('correct', 'incorrect');
    index++;
  });
}

// Function to get the current state of the puzzle as a string
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
  sudokuCells.forEach((cell, index) => {
    const cellData = puzzleState[index];
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
  let puzzleState = [];
  sudokuCells.forEach((cell) => {
    // Exclude 'correct' and 'incorrect' classes when saving
    const classesToSave = Array.from(cell.classList).filter(className => className !== 'correct' && className !== 'incorrect');
    const cellData = {
      value: cell.value || '',
      isPrefilled: cell.classList.contains('prefilled-cell'),
      classes: classesToSave,
    };
    puzzleState.push(cellData);
  });
  return puzzleState;
}

// Update resetGame function to clear saved puzzle
function resetGame() {
  sudokuCells.forEach((cell) => {
    if (!cell.classList.contains('prefilled-cell')) {
      cell.value = '';
      cell.classList.remove('user-input', 'number-bar-input', 'correct', 'incorrect');
    }
  });
  undoStack = [];
  localStorage.removeItem('savedPuzzle');
}

// Function to check if all cells are filled
function isPuzzleComplete() {
  let complete = true;
  sudokuCells.forEach(cell => {
    if (cell.value === '') {
      complete = false;
    }
  });
  return complete;
}

// Function to validate the user's solution
function validateSolution() {
  let allCorrect = true;
  sudokuCells.forEach((cell, index) => {
    const userValue = parseInt(cell.value);
    const correctValue = solutionArray[index];

    if (userValue === correctValue) {
      // Correct value
      cell.classList.add('correct');
      cell.classList.remove('incorrect');
    } else {
      // Incorrect value
      cell.classList.add('incorrect');
      cell.classList.remove('correct');
      allCorrect = false;
    }
  });
  if (allCorrect) {
    alert('Congratulations! You have completed the puzzle correctly!');
  } else {
    alert('Some entries are incorrect. Incorrect numbers are highlighted in red.');
  }
}
