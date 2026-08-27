// Type shim for @turf/turf — needed because @turf/turf v6 has a broken
// package.json "exports" field that prevents TypeScript bundler-mode from
// resolving its types. skipLibCheck:true handles build, but this shim
// prevents tsc --noEmit from erroring in strict mode.
declare module '@turf/turf' {
  export * from '@turf/helpers';
  export { default as booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
  export { default as point } from '@turf/helpers';
  export { default as polygon } from '@turf/helpers';
  export function point(coordinates: [number, number], properties?: Record<string, unknown>): GeoJSON.Feature<GeoJSON.Point>;
  export function polygon(coordinates: number[][][], properties?: Record<string, unknown>): GeoJSON.Feature<GeoJSON.Polygon>;
  export function booleanPointInPolygon(
    point: GeoJSON.Feature<GeoJSON.Point> | GeoJSON.Point,
    polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | GeoJSON.Polygon | GeoJSON.MultiPolygon
  ): boolean;
}
