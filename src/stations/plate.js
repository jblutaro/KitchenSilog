export const slotFor = type => ['rice', 'egg'].includes(type) ? type : 'meat';
export function createPlate() { return { rice: null, meat: null, egg: null }; }
export function placeFood(plate, food) {
  if (!plate || !['cooked', 'overcooked'].includes(food.stage) || food.type === 'garlic') return false;
  const slot = slotFor(food.type);
  if (plate[slot]) return false;
  plate[slot] = { ...food }; return true;
}
export function isComplete(plate, meat) {
  return !!(plate?.rice && plate.egg && plate.meat
    && [plate.rice, plate.egg, plate.meat].every(item => ['cooked', 'overcooked'].includes(item.stage))
    && (!meat || plate.meat.type === meat));
}
