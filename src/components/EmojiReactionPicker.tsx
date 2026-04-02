import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile, Heart, ThumbsUp, Laugh, Star, Fire, PartyPopper, Rocket } from 'lucide-react';

interface EmojiReactionPickerProps {
  onReact: (emoji: string) => void;
  existingReactions?: Array<{ emoji: string; users: string[] }>;
  currentUserId: string;
}

const QUICK_REACTIONS = [
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '✅', label: 'Check' }
];

const ALL_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
  '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
  '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
  '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
  '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
  '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
  '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
  '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
  '⭐', '🌟', '✨', '⚡', '🔥', '💥', '☄️', '🌈', '☀️', '🌤️',
  '⛅', '🌥️', '🌦️', '🌧️', '⛈️', '🌩️', '❄️', '🌨️', '☃️', '⛄',
  '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧',
  '🎀', '🎁', '🎗️', '🎟️', '🎫', '🏆', '🏅', '🥇', '🥈', '🥉',
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
  '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣',
  '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️',
  '🚀', '🛸', '🚁', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈'
];

export function EmojiReactionPicker({ onReact, existingReactions = [], currentUserId }: EmojiReactionPickerProps) {
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [searchEmoji, setSearchEmoji] = useState('');

  const filteredEmojis = searchEmoji 
    ? ALL_EMOJIS.filter(emoji => emoji.includes(searchEmoji))
    : ALL_EMOJIS;

  const hasUserReacted = (emoji: string) => {
    const reaction = existingReactions.find(r => r.emoji === emoji);
    return reaction?.users.includes(currentUserId) || false;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="space-y-2">
          {/* Quick reactions */}
          <div className="grid grid-cols-4 gap-1">
            {QUICK_REACTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className={`p-2 text-2xl hover:bg-gray-100 rounded transition-colors ${
                  hasUserReacted(emoji) ? 'bg-blue-100' : ''
                }`}
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Show more button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllEmojis(!showAllEmojis)}
            className="w-full"
          >
            {showAllEmojis ? 'Show Less' : 'Show More Emojis'}
          </Button>

          {/* All emojis grid */}
          {showAllEmojis && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search emojis..."
                value={searchEmoji}
                onChange={(e) => setSearchEmoji(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded"
              />
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                {filteredEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className={`p-1 text-xl hover:bg-gray-100 rounded transition-colors ${
                      hasUserReacted(emoji) ? 'bg-blue-100' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}