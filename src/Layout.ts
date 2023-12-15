/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** Shape of the distributed tiled display and our space in it. */
export class Layout {
  constructor(rowParam: string | undefined, columnParam: string | undefined) {
    this.row = parseFloat(rowParam ?? "0") ?? 0;
    this.column = parseFloat(columnParam ?? "0") ?? 0;
  }

  readonly row: number;
  readonly column: number;
}
