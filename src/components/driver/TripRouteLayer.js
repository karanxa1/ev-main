import React, { memo, useMemo } from 'react';
import { Source, Layer, Marker } from 'react-map-gl';
import { FaMapMarkerAlt, FaFlag } from 'react-icons/fa';

const TripRouteLayer = memo(({ tripRoute }) => {
  // Memoize route layers to prevent unnecessary re-renders
  const routeLayers = useMemo(() => {
    if (!tripRoute?.routeGeoJSON) return null;

    return [
      {
        id: 'route-casing',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1A73E8',
          'line-width': 8,
          'line-opacity': 0.5,
          'line-blur': 1
        }
      },
      {
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#4285F4',
          'line-width': 4,
          'line-opacity': 0.8
        }
      },
      {
        id: 'route-arrows',
        type: 'symbol',
        source: 'route-source',
        layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': 12,
          'text-keep-upright': true,
          'symbol-spacing': 80,
          'text-pitch-alignment': 'viewport',
          'text-rotation-alignment': 'map'
        },
        paint: {
          'text-color': '#FFF',
          'text-halo-color': '#1A73E8',
          'text-halo-width': 1
        }
      }
    ];
  }, [tripRoute?.routeGeoJSON]);

  if (!tripRoute) return null;

  return (
    <>
      {/* Route visualization */}
      {tripRoute.routeGeoJSON && (
        <Source id="route-source" type="geojson" data={tripRoute.routeGeoJSON}>
          {routeLayers.map(layer => (
            <Layer key={layer.id} {...layer} />
          ))}
        </Source>
      )}
      
      {/* Origin marker */}
      {tripRoute.origin && (
        <Marker
          longitude={tripRoute.origin.longitude}
          latitude={tripRoute.origin.latitude}
          anchor="bottom"
        >
          <div className="route-marker origin-marker">
            <FaMapMarkerAlt 
              style={{ color: '#0C5F2C', fontSize: '24px' }} 
              aria-label="Trip origin"
            />
            <div className="marker-label">Start</div>
          </div>
        </Marker>
      )}
      
      {/* Destination marker */}
      {tripRoute.destination && (
        <Marker
          longitude={tripRoute.destination.longitude}
          latitude={tripRoute.destination.latitude}
          anchor="bottom"
        >
          <div className="route-marker destination-marker">
            <FaFlag 
              style={{ color: '#d32f2f', fontSize: '24px' }} 
              aria-label="Trip destination"
            />
            <div className="marker-label">End</div>
          </div>
        </Marker>
      )}
      
      {/* Charging stops */}
      {tripRoute.stops && tripRoute.stops.map((stop, index) => (
        <Marker
          key={`stop-${index}`}
          longitude={stop.longitude}
          latitude={stop.latitude}
          anchor="bottom"
        >
          <div className="route-marker stop-marker">
            <div className="stop-number">{index + 1}</div>
            <div className="marker-label">
              Charging Stop {index + 1}
              {stop.estimatedChargingTime && (
                <div className="charging-time">
                  ~{stop.estimatedChargingTime} min
                </div>
              )}
            </div>
          </div>
        </Marker>
      ))}
      
      {/* Route info overlay */}
      {tripRoute.summary && (
        <div className="route-info-overlay">
          <div className="route-summary">
            <div className="route-distance">
              📏 {tripRoute.summary.distance} km
            </div>
            <div className="route-duration">
              ⏱️ {tripRoute.summary.duration}
            </div>
            {tripRoute.summary.totalChargingTime && (
              <div className="route-charging-time">
                🔋 {tripRoute.summary.totalChargingTime} charging
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

TripRouteLayer.displayName = 'TripRouteLayer';

export default TripRouteLayer; 