const createAudioPlayer = ({ source, onPlaybackStatusUpdate }) => {
    const audio = new Audio(source);
    let isPlaying = false;

    audio.addEventListener('ended', () => {
        isPlaying = false;
        onPlaybackStatusUpdate?.({ didJustFinish: true });
    });

    return {
        play: async () => {
            try {
                if (!isPlaying) {
                    await audio.play();
                    isPlaying = true;
                }
            } catch (error) {
                console.error('Error playing audio:', error);
                isPlaying = false;
            }
        },
        stop: () => {
            audio.pause();
            audio.currentTime = 0;
            isPlaying = false;
        },
        cleanup: () => {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
        }
    };
};

export default createAudioPlayer;