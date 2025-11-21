interface GlobalCSSObject {
  content: string;
  remove?: () => void;
}

export function addGlobalCSS(styles: string): GlobalCSSObject {
  // Create a style element
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode(styles));
  document.head.appendChild(styleElement);
  return {
    content: styles,
    remove: () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    },
  };
}
