// shared/ui/styles/theme.js
// --------------------------------------------------------------
// Central theme configuration for Dalai Llama UI Platform
// --------------------------------------------------------------

export const theme = {
  colors: {
    primary: "var(--color-primary)",
    primaryHover: "var(--color-primary-hover)",

    blue: "var(--color-accent-blue)",
    blueHover: "var(--color-accent-blue-hover)",

    purpleLight: "var(--color-accent-purple-light)",

    textPrimary: "var(--color-text-primary)",
    textSecondary: "var(--color-text-secondary)",
    textMuted: "var(--color-text-muted)",
  },

  bg: {
    base: "var(--color-bg-base)",
    muted: "var(--color-bg-muted)",
    card: "var(--color-bg-card)",
  },

  status: {
    success: {
      bg: "var(--color-success-bg)",
      text: "var(--color-success-text)",
    },
    error: {
      bg: "var(--color-error-bg)",
      text: "var(--color-error-text)",
    },
    info: {
      bg: "var(--color-info-bg)",
      text: "var(--color-info-text)",
    },
  },

  radius: {
    sm: "var(--border-radius-sm)",
    md: "var(--border-radius-md)",
    lg: "var(--border-radius-lg)",
    full: "var(--border-radius-full)",
  },

  shadow: {
    soft: "var(--shadow-soft)",
    medium: "var(--shadow-medium)",
    strong: "var(--shadow-strong)",
  },

  transition: {
    fast: "var(--transition-fast)",
    medium: "var(--transition-medium)",
    slow: "var(--transition-slow)",
  },
};

export default theme;
