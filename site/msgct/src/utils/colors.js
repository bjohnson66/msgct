// colors.js
export const COLORS = {
    red: { dark: '#FF6F6F', light: '#A80000' },
    blue: { dark: '#005FFF', light: '#003080' },
    limeGreen: { dark: '#74ff79', light: '#449947' },
    yellow: { dark: '#FFD700', light: '#FFC107' },
    purple: { dark: '#8A2BE2', light: '#7352ad' },
    cyan: { dark: '#00CED1', light: '#008B8B' },
    pink: { dark: '#FF69B4', light: '#C2185B' },
    gray: { dark: '#B0BEC5', light: '#37474F' },
  };
  
  export const getColor = (color, isDarkMode) => (isDarkMode ? color.dark : color.light);  