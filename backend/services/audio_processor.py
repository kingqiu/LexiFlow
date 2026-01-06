"""
LexiFlow - Audio Processor Service
Handles audio concatenation with FFmpeg for repeat and interval features.
"""
import os
import subprocess
import tempfile
import uuid
from typing import List, Optional
from pathlib import Path

# Audio output directory
AUDIO_DIR = Path(__file__).parent.parent.parent / "OutputAudios"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


class AudioProcessor:
    """Service class for audio processing with FFmpeg."""
    
    def __init__(self):
        self.audio_dir = AUDIO_DIR
    
    def create_silence(self, duration_seconds: float, output_path: str) -> bool:
        """
        Create a silent audio file of specified duration.
        
        Args:
            duration_seconds: Duration of silence in seconds
            output_path: Path to save the silent audio file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"anullsrc=r=44100:cl=stereo",
                "-t", str(duration_seconds),
                "-c:a", "libmp3lame",
                "-b:a", "128k",
                output_path
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to create silence: {e.stderr.decode()}")
            return False
        except Exception as e:
            print(f"Error creating silence: {e}")
            return False
    
    def concatenate_audio_files(
        self,
        audio_files: List[str],
        output_path: str,
        repeat_count: int = 1,
        interval_seconds: float = 3.0
    ) -> Optional[str]:
        """
        Concatenate multiple audio files with repeat and interval.
        
        Args:
            audio_files: List of audio file paths
            output_path: Path for the final concatenated audio
            repeat_count: How many times to repeat each word
            interval_seconds: Silence duration between words
            
        Returns:
            Path to the output file, or None if failed
        """
        if not audio_files:
            return None
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create silence file for intervals
                silence_path = os.path.join(temp_dir, "silence.mp3")
                if not self.create_silence(interval_seconds, silence_path):
                    return None
                
                # Build the file list for concatenation
                file_list_path = os.path.join(temp_dir, "files.txt")
                with open(file_list_path, "w") as f:
                    for i, audio_file in enumerate(audio_files):
                        # Repeat each word
                        for r in range(repeat_count):
                            f.write(f"file '{audio_file}'\n")
                            
                            # Add interval silence between every speech segment 
                            # (except after the very last repeat of the last word)
                            if not (i == len(audio_files) - 1 and r == repeat_count - 1):
                                f.write(f"file '{silence_path}'\n")
                
                # Concatenate all files
                cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", file_list_path,
                    "-c:a", "libmp3lame",
                    "-b:a", "128k",
                    output_path
                ]
                subprocess.run(cmd, check=True, capture_output=True)
                
                return output_path
                
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg concatenation failed: {e.stderr.decode()}")
            return None
        except Exception as e:
            print(f"Error concatenating audio: {e}")
            return None
    
    def generate_output_filename(self) -> str:
        """Generate a unique output filename using timestamp format: YYYYMMDD-HHMMSS.mp3"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return str(self.audio_dir / f"{timestamp}.mp3")
    
    def cleanup_temp_files(self, file_paths: List[str]) -> None:
        """Remove temporary audio files."""
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"Failed to remove temp file {path}: {e}")


# Singleton instance
audio_processor = AudioProcessor()
