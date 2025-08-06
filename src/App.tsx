import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, Play, RotateCcw, Ticket, Volume2, Trophy, Zap, Star, Users, RefreshCw } from 'lucide-react';

// Tambola ticket generation logic with proper rules
const generateTambolaTicket = () => {
  // Column ranges for Tambola (9 columns)
  const columnRanges = [
    [1, 10], [11, 20], [21, 30], [31, 40], [41, 50],
    [51, 60], [61, 70], [71, 80], [81, 90]
  ];

  const ticket = Array(3).fill(null).map(() => Array(9).fill(null));
  
  // Track used numbers per column to avoid duplicates
  const usedNumbers = Array(9).fill(null).map(() => new Set());

  // For each row, select exactly 5 random columns and fill with numbers
  for (let row = 0; row < 3; row++) {
    const selectedColumns = [];
    while (selectedColumns.length < 5) {
      const col = Math.floor(Math.random() * 9);
      if (!selectedColumns.includes(col)) {
        selectedColumns.push(col);
      }
    }

    // Sort columns to maintain order
    selectedColumns.sort((a, b) => a - b);

    selectedColumns.forEach(col => {
      const [min, max] = columnRanges[col];
      let num;
      let attempts = 0;
      do {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
        attempts++;
        if (attempts > 100) break; // Prevent infinite loop
      } while (usedNumbers[col].has(num));
      
      usedNumbers[col].add(num);
      ticket[row][col] = num;
    });
  }

  // Sort numbers in each column
  for (let col = 0; col < 9; col++) {
    const columnNumbers = [];
    for (let row = 0; row < 3; row++) {
      if (ticket[row][col] !== null) {
        columnNumbers.push({ value: ticket[row][col], row });
      }
    }
    columnNumbers.sort((a, b) => a.value - b.value);
    
    // Clear column
    for (let row = 0; row < 3; row++) {
      ticket[row][col] = null;
    }
    
    // Place sorted numbers back
    columnNumbers.forEach(({ value, row }) => {
      ticket[row][col] = value;
    });
  }

  return ticket;
};

// Convert number to speech-friendly format
const numberToWords = (num) => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (num < 10) {
    return ones[num];
  } else if (num < 20) {
    return teens[num - 10];
  } else {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
  }
};

const speakNumber = (number) => {
  if ('speechSynthesis' in window) {
    const words = numberToWords(number);
    const utterance = new SpeechSynthesisUtterance(`Number ${number}, ${words}`);
    utterance.rate = 0.7;
    utterance.volume = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }
};

function App() {
  const [tickets, setTickets] = useState([]);
  const [markedNumbers, setMarkedNumbers] = useState(new Set());
  const [pickedNumbers, setPickedNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showTicketAnimation, setShowTicketAnimation] = useState(false);
  const [showNumberAnimation, setShowNumberAnimation] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showPlayerSetup, setShowPlayerSetup] = useState(true);
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'ready', 'playing', 'complete'

  const toggleNumberMark = useCallback((number) => {
    setMarkedNumbers(prev => {
      const newMarked = new Set(prev);
      if (newMarked.has(number)) {
        newMarked.delete(number);
      } else {
        newMarked.add(number);
      }
      return newMarked;
    });
  }, []);

  const generateTickets = useCallback((count = 1) => {
    const newTickets = Array(count).fill(null).map(() => generateTambolaTicket());
    setTickets(newTickets);
    setMarkedNumbers(new Set()); // Reset marked numbers when generating new tickets
    setShowTicketAnimation(true);
    setTimeout(() => setShowTicketAnimation(false), 1500);
    
    if (gamePhase === 'setup') {
      setGamePhase('ready');
    }
  }, [gamePhase]);

  const pickNumber = useCallback(() => {
    const availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
      .filter(num => !pickedNumbers.includes(num));

    if (availableNumbers.length === 0) {
      setGameComplete(true);
      setGamePhase('complete');
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Game complete! All numbers have been picked!');
        utterance.rate = 0.8;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const newNumber = availableNumbers[randomIndex];

    setCurrentNumber(newNumber);
    setPickedNumbers(prev => [...prev, newNumber]);
    setShowNumberAnimation(true);
    setGamePhase('playing');
    speakNumber(newNumber);
    
    setTimeout(() => setShowNumberAnimation(false), 3000);
  }, [pickedNumbers, gamePhase]);

  const startNewGame = useCallback(() => {
    setPickedNumbers([]);
    setCurrentNumber(null);
    setMarkedNumbers(new Set());
    setGameStarted(true);
    setShowNumberAnimation(false);
    setGameComplete(false);
    setConfetti(false);
    setGamePhase('ready');
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`New game started for ${playerName}! Let's play Tambola!`);
      utterance.rate = 0.8;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [playerName]);

  const handlePlayerSetup = (name) => {
    setPlayerName(name);
    setShowPlayerSetup(false);
    setGamePhase('setup');
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Welcome ${name}! Let's start playing Tambola!`);
      utterance.rate = 0.8;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Player Setup Modal
  if (showPlayerSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex items-center justify-center p-4">
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/30 shadow-2xl max-w-md w-full text-center">
          <div className="text-6xl mb-6 animate-bounce">🎊</div>
          <h1 className="text-3xl font-bold text-white mb-6">Welcome to Tambola Party!</h1>
          <p className="text-white/90 mb-6">Enter your name to start playing the most exciting Housie game!</p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name..."
              className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white placeholder-white/70 font-medium text-center text-lg focus:outline-none focus:ring-4 focus:ring-yellow-300/50"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && playerName.trim() && handlePlayerSetup(playerName.trim())}
            />
            <button
              onClick={() => playerName.trim() && handlePlayerSetup(playerName.trim())}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              🎮 Start Playing!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <Star className="text-white/20 w-4 h-4" />
          </div>
        ))}
      </div>

      {/* Confetti Effect */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '1s'
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with Player Info */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl animate-bounce">
              🎊 TAMBOLA PARTY TIME 🎉
            </h1>
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 inline-block border border-white/30 mb-4">
              <p className="text-lg md:text-xl text-white font-bold flex items-center justify-center gap-2">
                <Users className="text-yellow-300" />
                Player: {playerName}
                <Users className="text-yellow-300" />
              </p>
            </div>
            
            {/* Game Phase Indicator */}
            <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 inline-block border border-white/20">
              <p className="text-white font-medium">
                {gamePhase === 'setup' && '🎫 Generate your tickets to get started!'}
                {gamePhase === 'ready' && '🎯 Ready to play! Click "Pick Number" to start!'}
                {gamePhase === 'playing' && '🎪 Game in progress! Keep marking your numbers!'}
                {gamePhase === 'complete' && '🏆 Game Complete! All numbers picked!'}
              </p>
            </div>
            
            {gameComplete && (
              <div className="mt-4 text-2xl font-bold text-yellow-300 animate-bounce">
                🏆 CONGRATULATIONS {playerName.toUpperCase()}! GAME COMPLETE! 🏆
              </div>
            )}
          </div>

          <div className="grid xl:grid-cols-2 gap-8">
            {/* Ticket Generator Section */}
            <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/30 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Ticket className="text-yellow-300" />
                  🎟️ Your Tickets
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => generateTickets(1)}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-1 shadow-lg flex items-center gap-1"
                  >
                    <RefreshCw size={16} />
                    New Ticket
                  </button>
                  <button
                    onClick={() => generateTickets(6)}
                    className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-rotate-1 shadow-lg flex items-center gap-1"
                  >
                    <RefreshCw size={16} />
                    6 Tickets
                  </button>
                </div>
              </div>

              {/* Tickets Display */}
              <div className={`grid gap-6 ${tickets.length > 3 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {tickets.map((ticket, ticketIndex) => (
                  <div
                    key={`ticket-${ticketIndex}-${Date.now()}`}
                    className={`bg-white/25 backdrop-blur-lg rounded-2xl p-4 border-2 border-white/40 shadow-xl transform transition-all duration-500 hover:scale-105 ${
                      showTicketAnimation ? 'animate-bounce' : ''
                    }`}
                    style={{
                      animationDelay: `${ticketIndex * 0.15}s`
                    }}
                  >
                    <h3 className="text-white font-bold mb-3 text-center bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg py-2">
                      🎫 {playerName}'s Ticket #{ticketIndex + 1}
                    </h3>
                    <div className="bg-white rounded-xl p-3 shadow-inner">
                      <div className="grid grid-cols-9 gap-1">
                        {ticket.flat().map((cell, cellIndex) => (
                          <div
                            key={`cell-${ticketIndex}-${cellIndex}`}
                            className={`aspect-square flex items-center justify-center text-xs sm:text-sm font-bold rounded-lg transition-all duration-300 hover:scale-110 cursor-pointer ${
                              cell
                                ? markedNumbers.has(cell)
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg ring-2 ring-blue-300'
                                  : pickedNumbers.includes(cell)
                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg animate-pulse ring-2 ring-yellow-300'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 shadow-md hover:shadow-lg hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200'
                                : 'bg-transparent'
                            }`}
                            onClick={() => cell && toggleNumberMark(cell)}
                          >
                            {cell || ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {tickets.length === 0 && (
                <div className="text-center py-12 text-white/70">
                  <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Generate your first ticket to start playing!</p>
                  <p className="text-sm mt-2">Click "New Ticket" or "6 Tickets" above</p>
                </div>
              )}
            </div>

            {/* Number Picker Section */}
            <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/30 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Play className="text-green-300" />
                  🎯 Number Caller
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={startNewGame}
                    className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-1 flex items-center gap-2 shadow-lg"
                  >
                    <RotateCcw size={16} />
                    New Game
                  </button>
                  <button
                    onClick={pickNumber}
                    disabled={pickedNumbers.length === 90 || tickets.length === 0}
                    className="bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-rotate-1 flex items-center gap-2 shadow-lg"
                  >
                    <Volume2 size={16} />
                    Pick Number
                  </button>
                </div>
              </div>

              {/* Current Number Display */}
              {currentNumber && (
                <div className={`text-center mb-6 ${showNumberAnimation ? 'animate-pulse scale-110' : ''}`}>
                  <div className="relative">
                    <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white text-6xl md:text-8xl font-bold rounded-3xl py-6 md:py-8 px-8 md:px-12 inline-block shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/50">
                      {currentNumber}
                      <div className="absolute -top-2 -right-2 text-2xl animate-spin">⭐</div>
                    </div>
                  </div>
                  <p className="text-white text-lg md:text-xl font-bold mt-4 flex items-center justify-center gap-2">
                    <Sparkles className="text-yellow-300" />
                    Current Number: {numberToWords(currentNumber)}
                    <Sparkles className="text-yellow-300" />
                  </p>
                </div>
              )}

              {!currentNumber && gamePhase === 'ready' && (
                <div className="text-center mb-6 py-12">
                  <div className="text-6xl mb-4 animate-bounce">🎲</div>
                  <p className="text-white text-xl font-bold">Ready to pick the first number!</p>
                  <p className="text-white/80 text-sm mt-2">Click "Pick Number" to start the game</p>
                </div>
              )}

              {tickets.length === 0 && (
                <div className="text-center mb-6 py-12">
                  <div className="text-6xl mb-4">🎫</div>
                  <p className="text-white text-xl font-bold">Generate tickets first!</p>
                  <p className="text-white/80 text-sm mt-2">You need at least one ticket to play</p>
                </div>
              )}

              {/* Picked Numbers History */}
              <div className="bg-white/25 backdrop-blur-lg rounded-2xl p-4 border-2 border-white/40 shadow-xl">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
                  <Trophy className="text-yellow-300" />
                  🎪 Called Numbers ({pickedNumbers.length}/90)
                </h3>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-9 sm:grid-cols-10 gap-1.5">
                    {Array.from({ length: 90 }, (_, i) => i + 1).map(num => (
                      <div
                        key={num}
                        className={`aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all duration-300 hover:scale-110 ${
                          pickedNumbers.includes(num)
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg transform scale-105 animate-pulse'
                            : 'bg-white/20 text-white/60 hover:bg-white/30'
                        } ${num === currentNumber ? 'ring-4 ring-yellow-300 ring-opacity-75' : ''}`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fun Stats */}
          <div className="mt-8 bg-white/15 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/30 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
              <Star className="text-yellow-300" />
              🎊 {playerName}'s Game Statistics
              <Star className="text-yellow-300" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
              <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">
                  {tickets.length}
                </div>
                <div className="text-white font-medium">🎟️ Active Tickets</div>
              </div>
              <div className="bg-gradient-to-br from-green-400/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl md:text-5xl font-bold text-green-300 mb-2">
                  {pickedNumbers.length}
                </div>
                <div className="text-white font-medium">🎯 Numbers Called</div>
              </div>
              <div className="bg-gradient-to-br from-blue-400/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl md:text-5xl font-bold text-blue-300 mb-2">
                  {markedNumbers.size}
                </div>
                <div className="text-white font-medium">✅ Numbers Marked</div>
              </div>
              <div className="bg-gradient-to-br from-blue-400/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl md:text-5xl font-bold text-blue-300 mb-2">
                  {90 - pickedNumbers.length}
                </div>
                <div className="text-white font-medium">⏳ Numbers Left</div>
              </div>
              <div className="bg-gradient-to-br from-purple-400/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl md:text-5xl font-bold text-purple-300 mb-2">
                  {Math.round((pickedNumbers.length / 90) * 100)}%
                </div>
                <div className="text-white font-medium">🎪 Game Progress</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 text-center">🎮 How to Play Tambola</h3>
            <div className="grid md:grid-cols-2 gap-4 text-white/90">
              <div>
                <h4 className="font-bold text-yellow-300 mb-2">🎫 Step 1: Generate Tickets</h4>
                <p className="text-sm">Create your Tambola tickets. Each ticket has 3 rows and 9 columns with exactly 5 numbers per row. Numbers are arranged by column ranges (1-10, 11-20, etc.)</p>
              </div>
              <div>
                <h4 className="font-bold text-green-300 mb-2">🎯 Step 2: Start Calling Numbers</h4>
                <p className="text-sm">Click "Pick Number" to randomly call numbers from 1-90. Each number is announced aloud and will never repeat!</p>
              </div>
              <div>
                <h4 className="font-bold text-blue-300 mb-2">🎪 Step 3: Mark Your Tickets</h4>
                <p className="text-sm">Click numbers on your tickets to mark them manually (blue), or watch as called numbers automatically highlight in green. Keep track of your progress!</p>
              </div>
              <div>
                <h4 className="font-bold text-purple-300 mb-2">🏆 Step 4: Claim Wins!</h4>
                <p className="text-sm">Call out when you complete a line, two lines, or full house! Traditional Tambola winning patterns apply.</p>
              </div>
            </div>
            <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h4 className="font-bold text-white mb-2 text-center">🎨 Color Guide</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
                  <span>Blue: Numbers you marked manually</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded"></div>
                  <span>Green: Numbers called by the game</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded"></div>
                  <span>Gray: Unmarked numbers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

export default App;