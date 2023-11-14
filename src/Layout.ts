/** Shape of the distributed tiled display and our space in it. */
export class Layout {
  constructor(rowParam: string | undefined, columnParam: string | undefined) {
    this.row = parseFloat(rowParam ?? "0") ?? 0;
    this.column = parseFloat(columnParam ?? "0") ?? 0;
  }

  readonly row: number;
  readonly column: number;
}
