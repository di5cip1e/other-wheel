/**
 * Default audio theme with placeholder sound effects
 * In a real implementation, these would point to actual audio files
 */

import { AudioTheme } from '../engines/AudioEngine';

export const defaultAudioTheme: AudioTheme = {
  id: 'default',
  name: 'Default Audio Theme',
  soundEffects: {
    wheelSpin: {
      id: 'wheel-spin',
      name: 'Wheel Spin',
      url: '/assets/audio/wheel-spin.mp3',
      volume: 0.8,
      loop: false
    },
    wheelStop: {
      id: 'wheel-stop',
      name: 'Wheel Stop',
      url: '/assets/audio/wheel-stop.mp3',
      volume: 0.9,
      loop: false
    },
    powerMeterTick: {
      id: 'power-meter-tick',
      name: 'Power Meter Tick',
      url: '/assets/audio/power-meter-tick.mp3',
      volume: 0.6,
      loop: false
    },
    resultReveal: {
      id: 'result-reveal',
      name: 'Result Reveal',
      url: '/assets/audio/result-reveal.mp3',
      volume: 1.0,
      loop: false
    },
    buttonClick: {
      id: 'button-click',
      name: 'Button Click',
      url: '/assets/audio/button-click.mp3',
      volume: 0.7,
      loop: false
    },
    gameStart: {
      id: 'game-start',
      name: 'Game Start',
      url: '/assets/audio/game-start.mp3',
      volume: 0.9,
      loop: false
    },
    gameEnd: {
      id: 'game-end',
      name: 'Game End',
      url: '/assets/audio/game-end.mp3',
      volume: 0.9,
      loop: false
    }
  },
  backgroundMusic: {
    id: 'background-music',
    name: 'Background Music',
    url: '/assets/audio/background-music.mp3',
    volume: 0.4,
    loop: true
  }
};

export const retroAudioTheme: AudioTheme = {
  id: 'retro',
  name: 'Retro Audio Theme',
  soundEffects: {
    wheelSpin: {
      id: 'retro-wheel-spin',
      name: 'Retro Wheel Spin',
      url: '/assets/audio/retro/wheel-spin.wav',
      volume: 0.8,
      loop: false
    },
    wheelStop: {
      id: 'retro-wheel-stop',
      name: 'Retro Wheel Stop',
      url: '/assets/audio/retro/wheel-stop.wav',
      volume: 0.9,
      loop: false
    },
    powerMeterTick: {
      id: 'retro-power-meter-tick',
      name: 'Retro Power Meter Tick',
      url: '/assets/audio/retro/power-meter-tick.wav',
      volume: 0.6,
      loop: false
    },
    resultReveal: {
      id: 'retro-result-reveal',
      name: 'Retro Result Reveal',
      url: '/assets/audio/retro/result-reveal.wav',
      volume: 1.0,
      loop: false
    },
    buttonClick: {
      id: 'retro-button-click',
      name: 'Retro Button Click',
      url: '/assets/audio/retro/button-click.wav',
      volume: 0.7,
      loop: false
    },
    gameStart: {
      id: 'retro-game-start',
      name: 'Retro Game Start',
      url: '/assets/audio/retro/game-start.wav',
      volume: 0.9,
      loop: false
    },
    gameEnd: {
      id: 'retro-game-end',
      name: 'Retro Game End',
      url: '/assets/audio/retro/game-end.wav',
      volume: 0.9,
      loop: false
    }
  },
  backgroundMusic: {
    id: 'retro-background-music',
    name: 'Retro Background Music',
    url: '/assets/audio/retro/background-music.wav',
    volume: 0.3,
    loop: true
  }
};

export const silentAudioTheme: AudioTheme = {
  id: 'silent',
  name: 'Silent Theme',
  soundEffects: {
    wheelSpin: {
      id: 'silent-wheel-spin',
      name: 'Silent',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      volume: 0,
      loop: false
    },
    wheelStop: {
      id: 'silent-wheel-stop',
      name: 'Silent',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      volume: 0,
      loop: false
    },
    powerMeterTick: {
      id: 'silent-power-meter-tick',
      name: 'Silent',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      volume: 0,
      loop: false
    },
    resultReveal: {
      id: 'silent-result-reveal',
      name: 'Silent',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      volume: 0,
      loop: false
    },
    buttonClick: {
      id: 'silent-button-click',
      name: 'Silent',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      volume: 0,
      loop: false
    },
    gameStart: {
      id: 'silent-game-start',
      name: 'Silent',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      volume: 0,
      loop: false
    },
    gameEnd: {
      id: 'silent-game-end',
      name: 'Silent',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      volume: 0,
      loop: false
    }
  }
};