// Central Leaflet entry. Exposes Leaflet as a browser global (window.L) so
// non-ESM plugins like leaflet.heat can extend it — production ESM bundles do
// not set this global automatically, unlike the dev server.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

;(window as unknown as { L: typeof L }).L = L

export default L
