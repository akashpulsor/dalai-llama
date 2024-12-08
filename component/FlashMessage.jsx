import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { hideMessage } from './flashMessageSlice';

const FlashMessage = () => {
  const translateX = useRef(new Animated.Value(500)).current;
  const [isHeld, setIsHeld] = useState(false);
  const [exitDirection, setExitDirection] = useState('right'); // Track exit direction
  const timerRef = useRef(null);
  
  const flashState = useSelector((state) => {
    const messageState = state.flashMessage?.data || state.flashMessage;
    return {
      message: messageState?.message || '',
      type: messageState?.type || 'error',
      isVisible: messageState?.isVisible || false
    };
  });
  
  const dispatch = useDispatch();

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (!isHeld) {
        setExitDirection('left'); // Set exit direction to left for auto-hide
        hideMessageWithAnimation();
      }
    }, 3000);
  };

  const hideMessageWithAnimation = () => {
    const exitValue = exitDirection === 'left' ? -500 : 500;
    
    Animated.timing(translateX, {
      toValue: exitValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      dispatch(hideMessage());
      // Reset exit direction after animation completes
      setExitDirection('right');
    });
  };

  const handlePress = () => {
    setIsHeld(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClose = () => {
    setExitDirection('right'); // Set exit direction to right for manual close
    hideMessageWithAnimation();
  };

  useEffect(() => {
    if (flashState.isVisible) {
      setIsHeld(false);
      // Reset exit direction when showing new message
      setExitDirection('right');
      
      // Slide in animation from right
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10
      }).start();

      startTimer();
    } else {
      // Reset position when not visible
      translateX.setValue(500);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [flashState.isVisible, dispatch, translateX]);

  if (!flashState.isVisible || !flashState.message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        flashState.type === 'error' ? styles.errorContainer : styles.successContainer,
        {
          transform: [{ translateX }]
        }
      ]}
    >
      <Pressable onPress={handlePress} style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.text}>{flashState.message}</Text>
        </ScrollView>
        
        {isHeld && (
          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 999,
    borderRadius: 12,
    width: '40%',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  scrollView: {
    flex: 1,
    maxHeight: 168,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  errorContainer: {
    backgroundColor: '#ef4444',
  },
  successContainer: {
    backgroundColor: '#22c55e',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FlashMessage;