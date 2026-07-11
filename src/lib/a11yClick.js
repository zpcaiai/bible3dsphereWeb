// Accessibility helper for non-semantic clickable elements (<div>/<span>/<li> with onClick).
// Usage:  <div onClick={handler} {...a11yClickProps(handler)}>…</div>
// Adds role="button", tabIndex={0}, and Enter/Space keyboard activation that mirrors onClick,
// so keyboard and screen-reader users can operate the element. Behavior-preserving: it only
// ADDS keyboard support; the existing onClick is untouched.
export function a11yClickProps(handler, { role = 'button', tabIndex = 0 } = {}) {
  return {
    role,
    tabIndex,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (typeof handler === 'function') handler(e);
      }
    },
  };
}

export default a11yClickProps;
