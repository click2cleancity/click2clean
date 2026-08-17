// Loads the leaflet.heat plugin. Importing ./leaflet FIRST guarantees window.L
// is set before the plugin evaluates (ESM evaluates dependencies in import order),
// which is required for the plugin to attach L.heatLayer.
import './leaflet'
import 'leaflet.heat'
