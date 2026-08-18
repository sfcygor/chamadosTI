/**
 * Gera uma cor HSL consistente a partir de uma string (nome do usuário).
 * O mesmo nome sempre gera a mesma cor, garantindo identidade visual estável.
 */
export function colorFromString(str: string): { bg: string; text: string; border: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }
  // Use apenas matizes que ficam bonitos: excluindo vermelhos muito saturados
  const hue = Math.abs(hash % 360);
  const saturation = 55 + (Math.abs(hash >> 4) % 20); // 55-75%
  const lightness = 88 + (Math.abs(hash >> 8) % 8);   // 88-96% para fundo claro
  const textLightness = 30 + (Math.abs(hash >> 8) % 15); // 30-45% para texto escuro

  return {
    bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: `hsl(${hue}, ${saturation}%, ${textLightness}%)`,
    border: `hsl(${hue}, ${saturation}%, ${lightness - 15}%)`,
  };
}
