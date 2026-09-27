import { useState } from 'react';
import { Heart } from 'lucide-react';
import { notifySlack } from '../lib/slack';

interface LikeButtonProps {
  name: string;
  initiallyLiked: boolean;
  onLiked: () => void;
}

export function LikeButton({ name, initiallyLiked, onLiked }: LikeButtonProps) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    if (liked || sending) return;
    setSending(true);
    setLiked(true);
    onLiked();
    await notifySlack(`❤️ ${name} liked raagroom.`);
    setSending(false);
  };

  return (
    <button
      className={`like-button ${liked ? 'is-liked' : ''}`}
      onClick={handleClick}
      disabled={liked || sending}
      aria-pressed={liked}
      aria-label={liked ? 'Liked' : 'Like raagroom'}
    >
      <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
      {liked ? 'Thanks for the love' : 'Like this'}
    </button>
  );
}
