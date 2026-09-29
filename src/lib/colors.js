export const PREDEFINED_COLORS = [
  '#1E3A5F', '#2A4D77', '#36608F', '#4A7AAB', '#6394C6',
  '#C13B22', '#D34D34', '#E55F46', '#F07A65', '#FA9584',
  '#EAB308', '#D9A100', '#B8860B', '#996B00', '#7A5200',
  '#849B55', '#738A44', '#627933', '#516822', '#405711',
  '#2C1A14', '#3E2A24', '#503A34', '#624A44', '#745A54',
  '#E4CFB2', '#D6C0A1', '#C8B190', '#BAA27F', '#AC936E',
];

export const getContrastTextColor = (hexColor) => {
  if (!hexColor) return '#2C1A14';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#2C1A14' : '#FDFBF7';
};
