import React, { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

const createEmptyBoard = () => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));

const Tetris = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const getRandomPiece = () => {
    const shapes = Object.keys(SHAPES);
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    return {
      shape: SHAPES[randomShape],
      type: randomShape
    };
  };

  const checkCollision = useCallback((piece, pos, currentBoard) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newY = pos.y + y;
          const newX = pos.x + x;
          
          if (newY >= BOARD_HEIGHT || newX < 0 || newX >= BOARD_WIDTH) {
            return true;
          }
          if (newY >= 0 && currentBoard[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const mergePieceToBoard = useCallback(() => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPos.y + y;
          const boardX = currentPos.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }
    
    return newBoard;
  }, [board, currentPiece, currentPos]);

  const clearLines = useCallback((currentBoard) => {
    let linesCleared = 0;
    const newBoard = currentBoard.filter(row => {
      if (row.every(cell => cell !== 0)) {
        linesCleared++;
        return false;
      }
      return true;
    });
    
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    return { newBoard, linesCleared };
  }, []);

  const spawnNewPiece = useCallback(() => {
    const piece = getRandomPiece();
    const startPos = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
    
    if (checkCollision(piece, startPos, board)) {
      setGameOver(true);
      return;
    }
    
    setCurrentPiece(piece);
    setCurrentPos(startPos);
  }, [board, checkCollision]);

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPos = { ...currentPos, y: currentPos.y + 1 };
    
    if (checkCollision(currentPiece, newPos, board)) {
      const mergedBoard = mergePieceToBoard();
      const { newBoard, linesCleared } = clearLines(mergedBoard);
      setBoard(newBoard);
      setScore(prev => prev + linesCleared * 100);
      spawnNewPiece();
    } else {
      setCurrentPos(newPos);
    }
  }, [currentPiece, currentPos, board, gameOver, isPaused, checkCollision, mergePieceToBoard, clearLines, spawnNewPiece]);

  const moveHorizontal = useCallback((direction) => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPos = { ...currentPos, x: currentPos.x + direction };
    
    if (!checkCollision(currentPiece, newPos, board)) {
      setCurrentPos(newPos);
    }
  }, [currentPiece, currentPos, board, gameOver, isPaused, checkCollision]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const rotatedPiece = { ...currentPiece, shape: rotated };
    
    if (!checkCollision(rotatedPiece, currentPos, board)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, currentPos, board, gameOver, isPaused, checkCollision]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let newPos = { ...currentPos };
    while (!checkCollision(currentPiece, { ...newPos, y: newPos.y + 1 }, board)) {
      newPos.y++;
    }
    
    setCurrentPos(newPos);
    setTimeout(() => moveDown(), 50);
  }, [currentPiece, currentPos, board, gameOver, isPaused, checkCollision, moveDown]);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      spawnNewPiece();
    }
  }, [currentPiece, gameOver, spawnNewPiece]);

  useEffect(() => {
    const interval = setInterval(() => {
      moveDown();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [moveDown]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, moveHorizontal, moveDown, rotate, hardDrop]);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPos.y + y;
            const boardX = currentPos.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  const displayBoard = renderBoard();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">テトリス</h1>
        <div className="text-2xl text-yellow-400 font-bold">スコア: {score}</div>
      </div>
      
      <div className="relative">
        <div 
          className="border-4 border-gray-700 bg-black"
          style={{ 
            width: BOARD_WIDTH * BLOCK_SIZE,
            height: BOARD_HEIGHT * BLOCK_SIZE 
          }}
        >
          {displayBoard.map((row, y) => (
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="absolute border border-gray-800"
                style={{
                  width: BLOCK_SIZE,
                  height: BLOCK_SIZE,
                  left: x * BLOCK_SIZE,
                  top: y * BLOCK_SIZE,
                  backgroundColor: cell ? COLORS[cell] : 'transparent'
                }}
              />
            ))
          ))}
        </div>
        
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-4">ゲームオーバー</div>
              <div className="text-2xl text-white mb-4">最終スコア: {score}</div>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-bold"
              >
                もう一度プレイ
              </button>
            </div>
          </div>
        )}
        
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-4xl font-bold text-white">一時停止</div>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-white text-center space-y-2">
        <div className="text-lg font-bold">操作方法:</div>
        <div>← → : 左右移動</div>
        <div>↑ : 回転</div>
        <div>↓ : 下移動</div>
        <div>スペース : ハードドロップ</div>
        <div>P : 一時停止</div>
      </div>
      
      {!gameOver && (
        <div className="mt-4 space-x-4">
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            {isPaused ? '再開' : '一時停止'}
          </button>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            リセット
          </button>
        </div>
      )}
    </div>
  );
};

export default Tetris;