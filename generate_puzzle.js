		// Helper function to check if placing a number is safe
		function isSafe(board, row, col, num) {
			for (let x = 0; x < 9; x++) {
				if (board[row][x] === num || board[x][col] === num ||
					board[3 * Math.floor(row / 3) + Math.floor(x / 3)][3 * Math.floor(col / 3) + x % 3] === num) {
					return false;
				}
			}
			return true;
		}

		// Function to fill the board with a valid solution using backtracking
		function fillBoard(board) {
			for (let row = 0; row < 9; row++) {
				for (let col = 0; col < 9; col++) {
					if (board[row][col] === 0) {
						const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
						for (let num of numbers) {
							if (isSafe(board, row, col, num)) {
								board[row][col] = num;
								if (fillBoard(board)) {
									return true;
								}
								board[row][col] = 0; // Backtrack
							}
						}
						return false; // No number fits, need to backtrack
					}
				}
			}
			return true; // Fully filled
		}

		// Function to remove numbers to create a puzzle of a certain difficulty
		function removeNumbers(board, difficulty) {
			let cellsToRemove;
			switch (difficulty) {
				case "Easy":
					cellsToRemove = getRandomInt(35, 45);
					break;
				case "Intermediate":
					cellsToRemove = getRandomInt(46, 50);
					break;
				case "Hard":
					cellsToRemove = getRandomInt(51, 54);
					break;
				case "Extreme":
					cellsToRemove = getRandomInt(56, 58);
					break;
				default:
					cellsToRemove = getRandomInt(35, 54);
			}

			while (cellsToRemove > 0) {
				const row = getRandomInt(0, 8);
				const col = getRandomInt(0, 8);
				if (board[row][col] !== 0) {
					const backup = board[row][col];
					board[row][col] = 0;

					// Check if the puzzle still has a unique solution
					const boardCopy = JSON.parse(JSON.stringify(board));
					const solutions = [];
					findAllSolutions(boardCopy, solutions, 2);
					if (solutions.length !== 1) {
						board[row][col] = backup; // Restore the number
					} else {
						cellsToRemove--;
					}
				}
			}
			return board;
		}

		// Function to shuffle an array (used to randomize numbers for filling the board)
		function shuffleArray(array) {
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
			return array;
		}

		// Function to find all solutions up to maxSolutions for a given board
		function findAllSolutions(board, solutions, maxSolutions) {
			for (let row = 0; row < 9; row++) {
				for (let col = 0; col < 9; col++) {
					if (board[row][col] === 0) {
						for (let num = 1; num <= 9; num++) {
							if (isSafe(board, row, col, num)) {
								board[row][col] = num;
								if (!findAllSolutions(board, solutions, maxSolutions)) {
									return false;
								}
								board[row][col] = 0;
							}
						}
						return true; // Need to backtrack
					}
				}
			}
			solutions.push(JSON.parse(JSON.stringify(board)));
			return solutions.length < maxSolutions;
		}

		// Utility function to get a random integer between min and max (inclusive)
		function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		// Generate a new Sudoku puzzle
		function generateNewPuzzle() {
			let board = Array.from({ length: 9 }, () => Array(9).fill(0));
			if (fillBoard(board)) {
				board = removeNumbers(board, "Easy"); // Change difficulty as needed
				setBoard(board);
				alert('New puzzle generated!');
			} else {
				alert('Failed to generate a new puzzle.');
			}
		}
