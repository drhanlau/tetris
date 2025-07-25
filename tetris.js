class Tetris {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.nextCanvas = document.getElementById("nextCanvas");
    this.nextCtx = this.nextCanvas.getContext("2d");

    this.BLOCK_SIZE = 30;
    this.BOARD_WIDTH = 10;
    this.BOARD_HEIGHT = 20;

    this.board = this.createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropTime = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;
    this.paused = false;
    this.gameOver = false;

    this.currentPiece = null;
    this.nextPiece = null;

    this.pieces = {
      I: {
        shape: [[1, 1, 1, 1]],
        color: "#00f0f0",
      },
      O: {
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: "#f0f000",
      },
      T: {
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
        color: "#a000f0",
      },
      S: {
        shape: [
          [0, 1, 1],
          [1, 1, 0],
        ],
        color: "#00f000",
      },
      Z: {
        shape: [
          [1, 1, 0],
          [0, 1, 1],
        ],
        color: "#f00000",
      },
      J: {
        shape: [
          [1, 0, 0],
          [1, 1, 1],
        ],
        color: "#0000f0",
      },
      L: {
        shape: [
          [0, 0, 1],
          [1, 1, 1],
        ],
        color: "#f0a000",
      },
    };

    this.init();
  }

  createBoard() {
    return Array(this.BOARD_HEIGHT)
      .fill()
      .map(() => Array(this.BOARD_WIDTH).fill(0));
  }

  init() {
    this.setupEventListeners();
    this.spawnPiece();
    this.spawnNextPiece();
    this.gameLoop();
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (this.gameOver) return;

      switch (e.code) {
        case "ArrowLeft":
          this.movePiece(-1, 0);
          break;
        case "ArrowRight":
          this.movePiece(1, 0);
          break;
        case "ArrowDown":
          this.movePiece(0, 1);
          break;
        case "ArrowUp":
          this.rotatePiece();
          break;
        case "Space":
          this.hardDrop();
          e.preventDefault();
          break;
        case "KeyP":
          this.togglePause();
          break;
      }
    });
  }

  spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      this.currentPiece = this.createRandomPiece();
    }
    this.currentPiece.x =
      Math.floor(this.BOARD_WIDTH / 2) -
      Math.floor(this.currentPiece.shape[0].length / 2);
    this.currentPiece.y = 0;

    if (this.isCollision(this.currentPiece, 0, 0)) {
      this.endGame();
    }
  }

  spawnNextPiece() {
    this.nextPiece = this.createRandomPiece();
    this.drawNextPiece();
  }

  createRandomPiece() {
    const pieceTypes = Object.keys(this.pieces);
    const randomType =
      pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    const piece = this.pieces[randomType];

    return {
      shape: piece.shape.map((row) => [...row]),
      color: piece.color,
      x: 0,
      y: 0,
    };
  }

  movePiece(dx, dy) {
    if (!this.isCollision(this.currentPiece, dx, dy)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
    } else if (dy > 0) {
      this.placePiece();
    }
  }

  rotatePiece() {
    const rotated = this.rotate(this.currentPiece.shape);
    const originalShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;

    if (this.isCollision(this.currentPiece, 0, 0)) {
      this.currentPiece.shape = originalShape;
    }
  }

  rotate(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols)
      .fill()
      .map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = matrix[i][j];
      }
    }

    return rotated;
  }

  hardDrop() {
    while (!this.isCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
    }
    this.placePiece();
  }

  isCollision(piece, dx, dy) {
    const newX = piece.x + dx;
    const newY = piece.y + dy;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;

          if (
            boardX < 0 ||
            boardX >= this.BOARD_WIDTH ||
            boardY >= this.BOARD_HEIGHT ||
            (boardY >= 0 && this.board[boardY][boardX])
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  placePiece() {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;

          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      }
    }

    this.clearLines();
    this.spawnPiece();
    this.spawnNextPiece();
  }

  clearLines() {
    let linesCleared = 0;

    for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every((cell) => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
        linesCleared++;
        y++; // Check the same line again
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += this.calculateScore(linesCleared);
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
      this.updateUI();
    }
  }

  calculateScore(linesCleared) {
    const baseScore = [0, 40, 100, 300, 1200];
    return baseScore[linesCleared] * this.level;
  }

  togglePause() {
    this.paused = !this.paused;
  }

  endGame() {
    this.gameOver = true;
    document.getElementById("finalScore").textContent = this.score;
    document.getElementById("gameOver").style.display = "block";
  }

  restart() {
    this.board = this.createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropTime = 0;
    this.dropInterval = 1000;
    this.paused = false;
    this.gameOver = false;

    document.getElementById("gameOver").style.display = "none";
    this.updateUI();
    this.spawnPiece();
    this.spawnNextPiece();
  }

  updateUI() {
    document.getElementById("score").textContent = this.score;
    document.getElementById("lines").textContent = this.lines;
    document.getElementById("level").textContent = this.level;
  }

  drawBoard() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw placed pieces
    for (let y = 0; y < this.BOARD_HEIGHT; y++) {
      for (let x = 0; x < this.BOARD_WIDTH; x++) {
        if (this.board[y][x]) {
          this.ctx.fillStyle = this.board[y][x];
          this.ctx.fillRect(
            x * this.BLOCK_SIZE,
            y * this.BLOCK_SIZE,
            this.BLOCK_SIZE - 1,
            this.BLOCK_SIZE - 1
          );
        }
      }
    }

    // Draw current piece
    if (this.currentPiece) {
      this.ctx.fillStyle = this.currentPiece.color;
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x]) {
            const drawX = (this.currentPiece.x + x) * this.BLOCK_SIZE;
            const drawY = (this.currentPiece.y + y) * this.BLOCK_SIZE;
            this.ctx.fillRect(
              drawX,
              drawY,
              this.BLOCK_SIZE - 1,
              this.BLOCK_SIZE - 1
            );
          }
        }
      }
    }
  }

  drawNextPiece() {
    this.nextCtx.fillStyle = "#000";
    this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    if (this.nextPiece) {
      this.nextCtx.fillStyle = this.nextPiece.color;
      const offsetX =
        (this.nextCanvas.width - this.nextPiece.shape[0].length * 20) / 2;
      const offsetY =
        (this.nextCanvas.height - this.nextPiece.shape.length * 20) / 2;

      for (let y = 0; y < this.nextPiece.shape.length; y++) {
        for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
          if (this.nextPiece.shape[y][x]) {
            this.nextCtx.fillRect(offsetX + x * 20, offsetY + y * 20, 19, 19);
          }
        }
      }
    }
  }

  gameLoop(time = 0) {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (!this.paused && !this.gameOver) {
      this.dropTime += deltaTime;

      if (this.dropTime > this.dropInterval) {
        this.movePiece(0, 1);
        this.dropTime = 0;
      }
    }

    this.drawBoard();

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Start the game
const game = new Tetris();
