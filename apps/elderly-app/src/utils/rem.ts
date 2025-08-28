const BASE_SIZE = 100; // 1rem = 100px (基于750px设计稿)

export const setRem = () => {
  const scale = document.documentElement.clientWidth / 750;
  document.documentElement.style.fontSize = `${BASE_SIZE * scale}px`;
};

window.addEventListener('resize', setRem);
setRem();

// 将设计稿的 px 数值转换为 rem 字符串，方便在样式里用“px”思维开发
export const px2rem = (px: number): string => `${px / BASE_SIZE}rem`;
