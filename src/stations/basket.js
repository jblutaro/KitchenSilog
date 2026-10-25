export const BASKET_CAPACITY = 4;
export const INGREDIENTS = ['egg', 'rice', 'tapa', 'tocino', 'longganisa', 'garlic'];
export function addIngredient(basket, type) {
  if (basket.length >= BASKET_CAPACITY || !INGREDIENTS.includes(type)) return false;
  basket.push({ id: crypto.randomUUID(), type }); return true;
}
export function removeIngredient(basket, id) {
  const index = basket.findIndex(item => item.id === id);
  return index < 0 ? null : basket.splice(index, 1)[0];
}
