import React, { useCallback, useState } from "react";
import { UploadIcon, DownloadIcon } from "./icons/Icons";

declare const JSZip: any;

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileUpload(e.dataTransfer.files[0]);
      }
    },
    [onFileUpload]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  const getGameAssets = (gameType: "tictactoe" | "snake" | "puzzle") => {
    // --- Common Styles ---
    const commonCSS = `
      :root {
        --bg-color: #1a202c;
        --text-color: #e2e8f0;
        --button-bg: #4c51bf;
        --button-hover-bg: #434190;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: var(--bg-color);
        color: var(--text-color);
      }
      #game-container { text-align: center; }
      h1 { font-size: 3rem; margin-bottom: 0.5rem; }
      #status, #score { font-size: 1.25rem; height: 2rem; margin-bottom: 1rem; }
       button {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: bold;
        color: white;
        background-color: var(--button-bg);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      button:hover { background-color: var(--button-hover-bg); }
    `;

    // --- Tic-Tac-Toe Assets ---
    if (gameType === "tictactoe") {
      const gameCSS = `
          ${commonCSS}
          #board { display: grid; grid-template-columns: repeat(3, 100px); grid-template-rows: repeat(3, 100px); gap: 10px; margin-bottom: 1.5rem; }
          .cell { width: 100px; height: 100px; background-color: #2d3748; border: 2px solid #4a5568; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 4rem; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
          .cell:hover { background-color: #4a5568; }
          .cell.x { color: #63b3ed; }
          .cell.o { color: #f6ad55; }
        `;
      const gameJS = `
          document.addEventListener('DOMContentLoaded', () => {
            const board = document.getElementById('board');
            const statusDisplay = document.getElementById('status');
            const resetButton = document.getElementById('reset-button');
            const cells = Array.from({ length: 9 }, (_, i) => {
              const cell = document.createElement('div');
              cell.classList.add('cell'); cell.dataset.index = i; board.appendChild(cell); return cell;
            });
            let gameState = ['', '', '', '', '', '', '', '', ''], currentPlayer = 'X', gameActive = true;
            const winningMessage = () => \`Player \${currentPlayer} has won!\`, drawMessage = () => \`Game ended in a draw!\`, currentPlayerTurn = () => \`Player \${currentPlayer}'s turn\`;
            const winningConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
            function handleCellPlayed(cell, index) { gameState[index] = currentPlayer; cell.textContent = currentPlayer; cell.classList.add(currentPlayer.toLowerCase()); }
            function handlePlayerChange() { currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; statusDisplay.textContent = currentPlayerTurn(); }
            function handleResultValidation() {
              let roundWon = false;
              for (const condition of winningConditions) {
                const [a, b, c] = condition.map(i => gameState[i]);
                if (a && a === b && b === c) { roundWon = true; break; }
              }
              if (roundWon) { statusDisplay.textContent = winningMessage(); gameActive = false; return; }
              if (!gameState.includes('')) { statusDisplay.textContent = drawMessage(); gameActive = false; return; }
              handlePlayerChange();
            }
            function handleCellClick(e) {
              const cell = e.target; const index = parseInt(cell.dataset.index);
              if (gameState[index] !== '' || !gameActive) return;
              handleCellPlayed(cell, index); handleResultValidation();
            }
            function handleResetGame() {
              gameState = ['', '', '', '', '', '', '', '', '']; gameActive = true; currentPlayer = 'X';
              statusDisplay.textContent = currentPlayerTurn();
              cells.forEach(cell => { cell.textContent = ''; cell.classList.remove('x', 'o'); });
            }
            cells.forEach(cell => cell.addEventListener('click', handleCellClick));
            resetButton.addEventListener('click', handleResetGame);
            statusDisplay.textContent = currentPlayerTurn();
          });
        `;
      return {
        title: "Tic-Tac-Toe",
        html: `<h1>Tic-Tac-Toe</h1><div id="status"></div><div id="board"></div><button id="reset-button">Reset Game</button>`,
        css: gameCSS,
        js: gameJS,
      };
    }

    // --- Snake Game Assets ---
    if (gameType === "snake") {
      const gameCSS = `${commonCSS} canvas { background-color: #000; border: 2px solid #4a5568; }`;
      const gameJS = `
          document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const scoreDisplay = document.getElementById('score');
            
            const gridSize = 20;
            let snake = [{ x: 10, y: 10 }];
            let food = {};
            let score = 0;
            let direction = 'right';
            let changingDirection = false;
            let gameActive = true;

            function main() {
              if (!gameActive) {
                  ctx.fillStyle = 'rgba(26, 32, 44, 0.8)';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.fillStyle = 'white';
                  ctx.font = '30px Arial';
                  ctx.textAlign = 'center';
                  ctx.fillText('Game Over! Press Enter to Restart', canvas.width / 2, canvas.height / 2);
                  return;
              }
              setTimeout(() => {
                changingDirection = false;
                clearCanvas();
                drawFood();
                moveSnake();
                drawSnake();
                main();
              }, 100);
            }

            function clearCanvas() { ctx.fillStyle = '#1a202c'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
            function drawSnakePart(part) { ctx.fillStyle = '#63b3ed'; ctx.strokeStyle = '#1a202c'; ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize); ctx.strokeRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize); }
            function drawSnake() { snake.forEach(drawSnakePart); }
            function drawFood() { ctx.fillStyle = '#f6ad55'; ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize); }
            
            function moveSnake() {
                const head = { x: snake[0].x, y: snake[0].y };
                if (direction === 'up') head.y -= 1;
                if (direction === 'down') head.y += 1;
                if (direction === 'left') head.x -= 1;
                if (direction === 'right') head.x += 1;
                snake.unshift(head);
                
                if (checkGameOver(head)) { gameActive = false; return; }

                if (head.x === food.x && head.y === food.y) {
                    score += 10;
                    scoreDisplay.textContent = 'Score: ' + score;
                    createFood();
                } else {
                    snake.pop();
                }
            }

            function checkGameOver(head) {
                for (let i = 4; i < snake.length; i++) {
                    if (snake[i].x === head.x && snake[i].y === head.y) return true;
                }
                const hitLeftWall = head.x < 0;
                const hitRightWall = head.x > canvas.width / gridSize - 1;
                const hitTopWall = head.y < 0;
                const hitBottomWall = head.y > canvas.height / gridSize - 1;
                return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
            }

            function createFood() {
                food.x = Math.floor(Math.random() * (canvas.width / gridSize));
                food.y = Math.floor(Math.random() * (canvas.height / gridSize));
                snake.forEach(part => { if (part.x === food.x && part.y === food.y) createFood(); });
            }

            function changeDirection(event) {
                if (changingDirection) return;
                changingDirection = true;
                const keyPressed = event.key;
                const goingUp = direction === 'up', goingDown = direction === 'down', goingLeft = direction === 'left', goingRight = direction === 'right';
                if ((keyPressed === 'ArrowUp' || keyPressed === 'w') && !goingDown) direction = 'up';
                if ((keyPressed === 'ArrowDown' || keyPressed === 's') && !goingUp) direction = 'down';
                if ((keyPressed === 'ArrowLeft' || keyPressed === 'a') && !goingRight) direction = 'left';
                if ((keyPressed === 'ArrowRight' || keyPressed === 'd') && !goingLeft) direction = 'right';
                if (!gameActive && keyPressed === 'Enter') restartGame();
            }
            
            function restartGame() {
                snake = [{ x: 10, y: 10 }];
                score = 0;
                direction = 'right';
                gameActive = true;
                scoreDisplay.textContent = 'Score: 0';
                createFood();
                main();
            }

            document.addEventListener('keydown', changeDirection);
            restartGame();
          });
        `;
      return {
        title: "Snake",
        html: `<h1>Snake</h1><div id="score">Score: 0</div><canvas id="gameCanvas" width="400" height="400"></canvas>`,
        css: gameCSS,
        js: gameJS,
      };
    }

    // --- Puzzle Game Assets ---
    if (gameType === "puzzle") {
      const gameCSS = `
          ${commonCSS}
          #board { display: grid; grid-template-columns: repeat(3, 100px); grid-template-rows: repeat(3, 100px); gap: 5px; padding: 5px; background-color: #4a5568; border-radius: 8px; margin-bottom: 1.5rem; }
          .tile { width: 100px; height: 100px; background-color: #2d3748; color: #e2e8f0; display: flex; justify-content: center; align-items: center; font-size: 2.5rem; font-weight: bold; cursor: pointer; user-select: none; transition: background-color 0.2s, transform 0.2s; }
          .tile:hover { background-color: #4a5568; }
          .tile.empty { background-color: transparent; cursor: default; }
        `;
      const gameJS = `
          document.addEventListener('DOMContentLoaded', () => {
            const board = document.getElementById('board');
            const statusDisplay = document.getElementById('status');
            const resetButton = document.getElementById('reset-button');
            const size = 3;
            let tiles = [];

            function setupBoard() {
                board.innerHTML = '';
                tiles = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
                tiles.push(null); // The empty space
                shuffle(tiles);
                render();
            }

            function render() {
                board.innerHTML = '';
                statusDisplay.textContent = '';
                tiles.forEach((num, index) => {
                    const tile = document.createElement('div');
                    tile.classList.add('tile');
                    if (num === null) {
                        tile.classList.add('empty');
                    } else {
                        tile.textContent = num;
                        tile.addEventListener('click', () => moveTile(index));
                    }
                    board.appendChild(tile);
                });
                if (isSolved()) {
                    statusDisplay.textContent = 'You win!';
                }
            }
            
            function moveTile(index) {
                const emptyIndex = tiles.indexOf(null);
                const { row, col } = getCoords(index);
                const { row: emptyRow, col: emptyCol } = getCoords(emptyIndex);

                if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) || (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
                    [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]]; // Swap
                    render();
                }
            }
            
            function isSolved() {
                for(let i = 0; i < tiles.length - 1; i++) {
                    if (tiles[i] !== i + 1) return false;
                }
                return true;
            }

            function shuffle(array) {
                // Fisher-Yates shuffle
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                // Check if solvable, if not, swap two tiles
                if (!isSolvable(array)) {
                    if (array[0] !== null && array[1] !== null) {
                        [array[0], array[1]] = [array[1], array[0]];
                    } else {
                        [array[array.length-2], array[array.length-1]] = [array[array.length-1], array[array.length-2]];
                    }
                }
            }

            function isSolvable(arr) {
                let inversions = 0;
                const flat = arr.filter(t => t !== null);
                for (let i = 0; i < flat.length - 1; i++) {
                    for (let j = i + 1; j < flat.length; j++) {
                        if (flat[i] > flat[j]) inversions++;
                    }
                }
                return inversions % 2 === 0;
            }
            
            const getCoords = (index) => ({ row: Math.floor(index / size), col: index % size });

            resetButton.addEventListener('click', setupBoard);
            setupBoard();
          });
        `;
      return {
        title: "Sliding Puzzle",
        html: `<h1>Sliding Puzzle</h1><div id="status"></div><div id="board"></div><button id="reset-button">Shuffle</button>`,
        css: gameCSS,
        js: gameJS,
      };
    }
    return null;
  };

  const handleDownloadSample = async (
    gameType: "tictactoe" | "snake" | "puzzle"
  ) => {
    const assets = getGameAssets(gameType);
    if (!assets) return;

    const zip = new JSZip();

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebGL Preview | ${assets.title}</title>
    <style>${assets.css}</style>
  </head>
  <body>
    <div id="game-container">
      ${assets.html}
    </div>
    <script>${assets.js}<\/script>
  </body>
</html>`;

    zip.file("index.html", htmlContent);
    zip.folder("Build");
    zip.folder("TemplateData");

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `SampleProject_${assets.title.replace(" ", "")}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const SampleButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ onClick, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center px-4 py-3 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 w-full"
    >
      <DownloadIcon className="w-4 h-4 mr-2" />
      {children}
    </button>
  );

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Upload Project (.zip)
      </label>
      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-md transition-colors duration-200 ${
          isDragging
            ? "border-indigo-400 bg-gray-700/50"
            : "border-gray-600 hover:border-gray-500"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <div className="text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-400">
            <span className="font-semibold text-indigo-400">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            ZIP archive of your WebGL build
          </p>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept=".zip"
            onChange={handleChange}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-center text-sm sm:text-base font-medium text-gray-300 mb-2">
          Don't have a project?
        </p>
        <p className="text-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          Download a sample to try out the previewer.
        </p>

        <div className="text-left text-xs bg-gray-900/50 p-2 sm:p-3 rounded-md border border-gray-700 mb-3 sm:mb-4 mx-auto max-w-xs sm:max-w-sm">
          <p className="font-mono text-gray-400 text-xs sm:text-sm">
            Required Project Structure:
          </p>
          <pre className="text-gray-500 whitespace-pre-wrap text-xs sm:text-sm">
            <code>
              {`YourProject.zip
├── Build/
├── TemplateData/
└── 📄 index.html`}
            </code>
          </pre>
        </div>

        <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto">
          <SampleButton onClick={() => handleDownloadSample("tictactoe")}>
            Tic-Tac-Toe
          </SampleButton>
          <SampleButton onClick={() => handleDownloadSample("snake")}>
            Snake Game
          </SampleButton>
          <SampleButton onClick={() => handleDownloadSample("puzzle")}>
            Sliding Puzzle
          </SampleButton>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
