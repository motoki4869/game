import React, { useState, useEffect } from 'react';
import { Heart, Shuffle, CheckCircle } from 'lucide-react';

const ValentineMatchingGame = () => {
  const [showNameInput, setShowNameInput] = useState(true);
  const [nameInputs, setNameInputs] = useState(Array(10).fill(''));
  
  const [leftPeople, setLeftPeople] = useState([
    { id: 'A', name: 'Aさん', emoji: '🧑' },
    { id: 'B', name: 'Bさん', emoji: '👨' },
    { id: 'C', name: 'Cさん', emoji: '👦' },
    { id: 'D', name: 'Dさん', emoji: '🧔' },
    { id: 'E', name: 'Eさん', emoji: '👨‍🦱' }
  ]);

  const [rightPeople, setRightPeople] = useState([
    { id: 'F', name: 'Fさん', emoji: '👩' },
    { id: 'G', name: 'Gさん', emoji: '👧' },
    { id: 'H', name: 'Hさん', emoji: '👱‍♀️' },
    { id: 'I', name: 'Iさん', emoji: '🧕' },
    { id: 'J', name: 'Jさん', emoji: '👩‍🦰' }
  ]);

  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const leftRefs = React.useRef<Record<string, HTMLElement>>({});
  const rightRefs = React.useRef<Record<string, HTMLElement>>({});
  const [, forceUpdate] = useState({});

  const colors = ['#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#10b981'];

  useEffect(() => {
    if (Object.keys(matches).length === 5) {
      setIsComplete(true);
    }
  }, [matches]);

  const handleLeftClick = (person: { id: string; name: string; emoji: string }) => {
    setSelectedLeft(person.id);
  };

  const handleRightClick = (person: { id: string; name: string; emoji: string }) => {
    if (selectedLeft) {
      const newMatches = { ...matches };
      
      Object.keys(newMatches).forEach(key => {
        if (key === selectedLeft || newMatches[key] === person.id) {
          delete newMatches[key];
        }
      });
      
      newMatches[selectedLeft] = person.id;
      setMatches(newMatches);
      setSelectedLeft(null);
    }
  };

  const handleReset = () => {
    setMatches({});
    setSelectedLeft(null);
    setIsComplete(false);
  };

  const handleAutoMatch = () => {
    const shuffledRight = [...rightPeople].sort(() => Math.random() - 0.5);
    const newMatches: Record<string, string> = {};
    leftPeople.forEach((person, index) => {
      newMatches[person.id] = shuffledRight[index].id;
    });
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const getMatchColor = (leftId: string): string => {
    const matchIndex = Object.keys(matches).indexOf(leftId);
    return matchIndex !== -1 ? colors[matchIndex % colors.length] : colors[0];
  };

  const isRightMatched = (rightId: string) => {
    return Object.values(matches).includes(rightId);
  };

  useEffect(() => {
    if (Object.keys(matches).length > 0) {
      forceUpdate({});
    }
  }, [matches]);

  const getLineCoordinates = (leftId: string, rightId: string) => {
    const leftEl = leftRefs.current[leftId] as HTMLElement;
    const rightEl = rightRefs.current[rightId] as HTMLElement;
    
    if (!leftEl || !rightEl) return null;
    
    const leftRect = leftEl.getBoundingClientRect();
    const rightRect = rightEl.getBoundingClientRect();
    const container = leftEl.closest('.relative');
    const containerRect = container?.getBoundingClientRect();
    
    if (!containerRect) return null;
    
    return {
      x1: leftRect.right - containerRect.left,
      y1: leftRect.top + leftRect.height / 2 - containerRect.top,
      x2: rightRect.left - containerRect.left,
      y2: rightRect.top + rightRect.height / 2 - containerRect.top
    };
  };

  const handleNameChange = (id: string, newName: string, isLeft: boolean) => {
    if (isLeft) {
      setLeftPeople(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    } else {
      setRightPeople(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    }
  };

  const handleNameInputChange = (index: number, value: string) => {
    const newInputs = [...nameInputs];
    newInputs[index] = value;
    setNameInputs(newInputs);
  };

  const handleStartGame = () => {
    const emojis = ['🧑', '👨', '👦', '🧔', '👨‍🦱', '👩', '👧', '👱‍♀️', '🧕', '👩‍🦰'];
    const ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    const filledNames = nameInputs.filter(name => name.trim() !== '');
    if (filledNames.length < 10) {
      alert('10人全員の名前を入力してください！');
      return;
    }
    
    const shuffledData = nameInputs.map((name, index) => ({
      id: ids[index],
      name: name.trim(),
      emoji: emojis[index]
    })).sort(() => Math.random() - 0.5);
    
    setLeftPeople(shuffledData.slice(0, 5));
    setRightPeople(shuffledData.slice(5, 10));
    setShowNameInput(false);
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-red-50 to-pink-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-red-500 mb-2 flex items-center justify-center gap-2">
              <Heart className="fill-red-500" />
              参加者の名前を入力
              <Heart className="fill-red-500" />
            </h1>
            <p className="text-gray-600">10人の名前を入力してください</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {nameInputs.map((name, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {index + 1}人目
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameInputChange(index, e.target.value)}
                  placeholder="名前を入力"
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:border-red-400 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-4 rounded-lg hover:from-pink-600 hover:to-red-600 transition-colors text-lg font-bold shadow-lg"
          >
            ゲームを開始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-red-50 to-pink-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-5xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-500 mb-2 flex items-center justify-center gap-2">
            <Heart className="fill-red-500" />
            バレンタイン ペアマッチング
            <Heart className="fill-red-500" />
          </h1>
          <p className="text-gray-600">左の人をクリック → 右の人をクリックでペアを作ろう！（10人・5対5）</p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleAutoMatch}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-colors shadow-lg"
          >
            <Shuffle size={20} />
            自動マッチング
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Shuffle size={20} />
            リセット
          </button>
        </div>

        <div className="relative" style={{ minHeight: '600px' }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {Object.entries(matches).map(([leftId, rightId]: [string, string]) => {
              const coords = getLineCoordinates(leftId, rightId);
              if (!coords) return null;
              
              const color = getMatchColor(leftId);
              
              return (
                <line
                  key={`${leftId}-${rightId}`}
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke={color}
                  strokeWidth="4"
                  strokeDasharray="8,4"
                  className="animate-pulse"
                />
              );
            })}
          </svg>

          <div className="flex justify-between items-start relative" style={{ zIndex: 1 }}>
            <div className="flex flex-col gap-6 w-1/3">
              {leftPeople.map((person) => {
                const isSelected = selectedLeft === person.id;
                const isMatched = matches[person.id];
                const color = getMatchColor(person.id);
                
                return (
                  <button
                    key={person.id}
                    ref={(el) => { if (el) leftRefs.current[person.id] = el; }}
                    onClick={() => handleLeftClick(person)}
                    className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'bg-yellow-300 ring-4 ring-yellow-400'
                        : isMatched
                        ? 'bg-green-200'
                        : 'bg-pink-100 hover:bg-pink-200'
                    }`}
                    style={isMatched ? { backgroundColor: color + '40' } : {}}
                  >
                    <div className="text-5xl mb-2">{person.emoji}</div>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => handleNameChange(person.id, e.target.value, true)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-center font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-400 focus:border-red-500 focus:outline-none"
                    />
                    {isMatched && <CheckCircle className="mx-auto mt-2 text-green-600" size={24} />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center w-1/3">
              <Heart className="text-red-300 fill-red-300" size={64} />
            </div>

            <div className="flex flex-col gap-6 w-1/3">
              {rightPeople.map((person) => {
                const isMatched = isRightMatched(person.id);
                const matchedLeftId = Object.keys(matches).find(key => matches[key] === person.id);
                const color = matchedLeftId ? getMatchColor(matchedLeftId) : null;
                
                return (
                  <button
                    key={person.id}
                    ref={(el) => { if (el) rightRefs.current[person.id] = el; }}
                    onClick={() => handleRightClick(person)}
                    className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                      isMatched
                        ? 'bg-green-200'
                        : 'bg-blue-100 hover:bg-blue-200'
                    }`}
                    style={isMatched ? { backgroundColor: color + '40' } : {}}
                  >
                    <div className="text-5xl mb-2">{person.emoji}</div>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => handleNameChange(person.id, e.target.value, false)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-center font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                    />
                    {isMatched && <CheckCircle className="mx-auto mt-2 text-green-600" size={24} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {isComplete && (
          <div className="mt-8 text-center bg-gradient-to-r from-pink-100 to-red-100 rounded-xl p-6">
            <div className="text-5xl mb-3">🎉💝🎉</div>
            <h2 className="text-3xl font-bold text-red-500 mb-2">
              全員マッチング完了！
            </h2>
            <p className="text-gray-700 text-lg">
              素敵なペアができました！
            </p>
            <p className="text-sm text-gray-600 mt-2">
              ハッピーバレンタイン！💕
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValentineMatchingGame;