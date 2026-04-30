import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    psuBlue: '#1E407C',
    psuLightBlue: '#2F5FAD',
    psuWhite: '#FFFFFF',
    psuGray: '#f4f6fa',
    psuGrayDark: '#6b7280',
    psuAccent: '#96bee6',
    psuBorder: '#d1dae8',
    danger: '#dc2626',
    success: '#16a34a',
  },
  fonts: {
    body: "'Segoe UI', system-ui, sans-serif",
  },
  radius: '8px',
};

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: ${({ theme }) => theme.fonts.body};
    background-color: ${({ theme }) => theme.colors.psuGray};
    color: #1a1a2e;
    line-height: 1.6;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
`;
