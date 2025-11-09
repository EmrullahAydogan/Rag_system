/**
 * Centralized theme utility classes for consistent dark mode support
 * Usage: Import and use these classes across components to maintain consistency
 */

export const themeClasses = {
  // Page backgrounds
  page: 'min-h-screen bg-gray-50 dark:bg-gray-900',
  pageAlt: 'min-h-screen bg-white dark:bg-gray-950',

  // Card/Container backgrounds
  card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  cardHover: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750',
  cardAlt: 'bg-gray-50 dark:bg-gray-800',

  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300',
    muted: 'text-gray-600 dark:text-gray-400',
    disabled: 'text-gray-400 dark:text-gray-600',
  },

  // Heading colors
  heading: {
    h1: 'text-gray-900 dark:text-white',
    h2: 'text-gray-800 dark:text-gray-100',
    h3: 'text-gray-700 dark:text-gray-200',
  },

  // Input fields
  input: {
    base: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
    focus: 'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400',
    disabled: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  },

  // Buttons
  button: {
    primary: 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',
    danger: 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  },

  // Badges and tags
  badge: {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    primary: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  },

  // Borders
  border: {
    default: 'border-gray-200 dark:border-gray-700',
    light: 'border-gray-100 dark:border-gray-800',
    strong: 'border-gray-300 dark:border-gray-600',
  },

  // Dividers
  divider: 'border-gray-200 dark:border-gray-700',

  // Tables
  table: {
    header: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    row: 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800',
    rowAlt: 'bg-gray-50 dark:bg-gray-850',
    cell: 'text-gray-900 dark:text-gray-100',
  },

  // Modal/Dialog
  modal: {
    backdrop: 'bg-black bg-opacity-50 dark:bg-opacity-70',
    content: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  },

  // Dropdown/Select
  dropdown: {
    menu: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    item: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100',
    itemActive: 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100',
  },

  // Charts (for Recharts)
  chart: {
    background: 'bg-white dark:bg-gray-800',
    text: 'fill-gray-600 dark:fill-gray-400',
    grid: 'stroke-gray-200 dark:stroke-gray-700',
    tooltip: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  },

  // Message bubbles (for chat)
  message: {
    user: 'bg-blue-600 dark:bg-blue-500 text-white',
    assistant: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
    system: 'bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100',
  },

  // Loading states
  skeleton: 'bg-gray-200 dark:bg-gray-700 animate-pulse',

  // Links
  link: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300',

  // Icons
  icon: {
    default: 'text-gray-500 dark:text-gray-400',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  },
};

/**
 * Helper function to combine theme classes
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
