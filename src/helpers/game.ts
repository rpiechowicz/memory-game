function createCustomGameSeed(gridCols: number, gridRows: number): string {
  return `${gridCols}-${gridRows}`
}

function checkGameSeed(seed: string): boolean {
  const [gridCols, gridRows] = seed.split('-')
  return gridCols && gridRows
}

export { checkGameSeed, createCustomGameSeed }
