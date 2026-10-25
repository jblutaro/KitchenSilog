// Coordinates are art pixels. Rectangles are [x, y, width, height].
export const layout = {
  basketSlots: [[2, -2], [8, -2], [3, -1], [9, -1]],
  basketFrontY: 2,
  room: {
    tile: [20, 80, 8, 8], floorStart: 56, baseboard: [55, 1], trim: [2, 1],
    decor: [
      { name: 'window', edge: 'left', x: -26, y: 16 },
      { name: 'calendar', edge: 'left', x: -17, y: 39 },
      { name: 'wall-clock', edge: 'right', x: 5, y: 17 },
      { name: 'plant', edge: 'left', x: -16, y: 80 },
      { name: 'rice-sack', edge: 'right', x: 9, y: 75 },
      { name: 'stool', edge: 'right', x: 2, y: 93 },
      { name: 'banig-rug', edge: 'inside', x: 35, y: 88 },
      { name: 'pendant-lamp', edge: 'inside', x: 68, y: 3, ceiling: true },
      { name: 'pendant-lamp', edge: 'left', x: -16, y: 3, ceiling: true },
      { name: 'pendant-lamp', edge: 'right', x: 7, y: 3, ceiling: true },
    ],
  },
  kitchen: {
    size: [100, 100], stove: [1, 39, 26, 34], fridge: [73, 28, 26, 45], sink: [54, 41, 14, 14],
    burners: [[9.5, 48.5], [18.5, 48.5], [9.5, 53.5], [18.5, 53.5]],
    burnerZones: [[5, 46, 8, 4], [14, 46, 8, 4], [5, 51, 8, 4], [14, 51, 8, 4]],
    gauges: [[9.5, 33], [18.5, 33], [9.5, 37], [18.5, 37]],
    plate: [32, 48.75], plateZone: [30, 44, 15, 12], plated: { rice: [3, -3], meat: [2, 3], egg: [10, 2] },
    sinkHighlight: [57, 48], fridgeAnimation: [62, 27], basket: [78, 75], basketItems: [79, 75, 4],
    trash: [2, 75], warning: [14, 30],
  },
  stove: {
    size: [160, 100], burners: [[35, 41], [85, 41], [35, 72], [85, 72]],
    burnerZones: [[16, 27, 38, 29], [66, 27, 38, 29], [16, 58, 38, 29], [66, 58, 38, 29]],
    panOffset: [-16, -10], wokOffset: [-22, -11], foodPanOffset: [2, 2], foodWokOffset: [8, 3],
    plate: [122, 62], plateZone: [120, 56, 39, 24], plated: { rice: [5, -5], meat: [4, 5], egg: [18, 2] },
    basket: [124, 22], basketItems: [125, 24, 7], trash: [146, 84], close: [149, 2],
    gaugeOffset: [-24, 0], flipOffset: [0, -14],
  },
  fridge: {
    size: [160, 100], ingredients: { egg: [20, 10], rice: [56, 10], tapa: [20, 36], tocino: [56, 36], longganisa: [92, 36], garlic: [20, 62] },
    basket: [118, 70], close: [149, 2],
    labels: { egg: 'EGGS', rice: 'RICE', tapa: 'TAPA', tocino: 'TOCINO', longganisa: 'LONGGANISA', garlic: 'GARLIC' },
    labelCenters: { egg: 32, rice: 68, tapa: 30, tocino: 63, longganisa: 110, garlic: 32 },
    shelfEdges: [34, 60, 86],
  },
};
