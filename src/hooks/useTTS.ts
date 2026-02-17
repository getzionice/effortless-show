import { useState, useRef, useCallback } from "react";

export function useTTS() {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
  }, []);

  const play = useCallback(async (text: string, voiceId: string, elevenLabsId: string) => {
    // If same voice is playing, stop it
    if (playingVoiceId === voiceId) {
      stop();
      return;
    }

    stop();
    setLoadingVoiceId(voiceId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId: elevenLabsId }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPlayingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audioRef.current = audio;
      await audio.play();
      setPlayingVoiceId(voiceId);
    } catch (error) {
      console.error("TTS playback failed:", error);
    } finally {
      setLoadingVoiceId(null);
    }
  }, [playingVoiceId, stop]);

  return { play, stop, playingVoiceId, loadingVoiceId };
}
