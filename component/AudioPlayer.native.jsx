import React, { useEffect } from 'react';
import { Audio } from 'expo-av';

const AudioPlayer = ({ source, onPlaybackStatusUpdate }) => {
    useEffect(() => {
        let sound;
        const loadSound = async () => {
            const { sound: newSound } = await Audio.Sound.createAsync(
                source,
                { shouldPlay: true }
            );
            sound = newSound;
            sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        };

        loadSound();

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [source]);

    return null;
};

export default AudioPlayer;