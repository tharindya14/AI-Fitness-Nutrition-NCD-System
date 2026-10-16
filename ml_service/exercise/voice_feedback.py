import time
import win32com.client


class VoiceFeedback:
    """
    Voice feedback engine using Windows SAPI for reliable TTS.
    """

    def __init__(self, cooldown_seconds=3):
        self.cooldown_seconds = cooldown_seconds
        self.last_spoken = {}

        self.voice = win32com.client.Dispatch("SAPI.SpVoice")
        self.voice.Rate = 0  # Normal speed
        self.voice.Volume = 100  # Full volume

    def speak(self, message, force=False):
        current_time = time.time()

        last_time = self.last_spoken.get(message, 0)

        if not force:
            if current_time - last_time < self.cooldown_seconds:
                return

        self.last_spoken[message] = current_time

        try:
            print(f"VOICE AUDIO: {message}")
            self.voice.Speak(message)
        except Exception as e:
            print("Voice feedback error:", e)