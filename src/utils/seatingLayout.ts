import { Table } from '../types';

export interface SeatPos {
  x: number;
  y: number;
}

export interface Layout {
  positions: SeatPos[];
  containerW: number;
  containerH: number;
  tableShape: { x: number; y: number; w: number; h: number; round: boolean };
  seatR: number;
}

export function computeLayout(table: Table, minWidth = 0): Layout {
  const n = Math.max(1, table.seats);

  if (table.shape === 'round') {
    // Seat radius shrinks slightly for very large tables, but stays readable
    const seatR = n <= 8 ? 24 : n <= 14 ? 20 : n <= 20 ? 17 : n <= 30 ? 14 : n <= 40 ? 12 : 10;
    const gap = 6;
    // Orbit grows so seats never overlap: circumference ≥ n * (diameter + gap)
    const orbitR = Math.max(55, Math.ceil((n * (seatR * 2 + gap)) / (2 * Math.PI)));
    const tableR = Math.max(24, Math.round(orbitR * 0.52));
    const size = Math.max(minWidth, (orbitR + seatR + 12) * 2);
    const cx = size / 2;
    const cy = size / 2;

    return {
      positions: Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return { x: cx + orbitR * Math.cos(angle), y: cy + orbitR * Math.sin(angle) };
      }),
      containerW: size,
      containerH: size,
      tableShape: { x: cx - tableR, y: cy - tableR, w: tableR * 2, h: tableR * 2, round: true },
      seatR,
    };
  } else {
    // Rectangular: strictly ONE row on top, ONE row on bottom.
    // Table width stretches to fit all top-row seats side by side.
    const topCount = Math.ceil(n / 2);
    const bottomCount = Math.floor(n / 2);

    // Seat radius: readable but scales down for many seats
    const seatR = n <= 10 ? 24 : n <= 20 ? 20 : n <= 30 ? 16 : n <= 40 ? 14 : 12;
    const gap = 6;
    const seatStep = seatR * 2 + gap; // center-to-center distance
    const edgePad = seatR + 10;       // padding from card edge to first seat center

    // Width driven by the longer row (always topCount = ceil)
    const W = Math.max(minWidth, edgePad * 2 + topCount * seatStep - gap);

    const topCY = seatR + 4;
    const tableTopY = topCY + seatR + 8;
    const tableH = Math.max(28, seatR + 10);
    const tableBottomY = tableTopY + tableH;
    const bottomCY = tableBottomY + seatR + 8;
    const H = bottomCY + seatR + 4;

    const positions: SeatPos[] = [];

    // Top row: left → right
    for (let i = 0; i < topCount; i++) {
      positions.push({ x: edgePad + i * seatStep + seatR - gap / 2, y: topCY });
    }
    // Bottom row: right → left (mirror of top, for visual symmetry)
    for (let i = 0; i < bottomCount; i++) {
      positions.push({ x: W - edgePad - i * seatStep - seatR + gap / 2, y: bottomCY });
    }

    return {
      positions,
      containerW: W,
      containerH: H,
      tableShape: { x: edgePad, y: tableTopY, w: W - edgePad * 2, h: tableH, round: false },
      seatR,
    };
  }
}
