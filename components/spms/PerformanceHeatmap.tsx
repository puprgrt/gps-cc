import React, { useEffect, useState } from 'react';
import { HeatmapKecamatan } from '@/domain/spms';
import { Map, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Leaflet MUST be dynamically imported with ssr: false because it uses window object
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-900/50 flex items-center justify-center text-slate-500 text-xs">Memuat Peta...</div> }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export function PerformanceHeatmap({ data }: { data: HeatmapKecamatan[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data || data.length === 0) {
    return <div className="glass-card p-6 h-full min-h-[300px] animate-pulse bg-white/5" />;
  }

  // Garut Regency Center Coordinates
  const center: [number, number] = [-7.2275, 107.9089];

  const getColorByPriority = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="glass-card p-0 h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-4 left-4 z-[400] bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-xl pointer-events-none">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <Map className="w-4 h-4 text-emerald-400" />
          Peta Titik Rawan
        </h2>
        <div className="flex items-center gap-2 text-[9px] mt-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Tinggi</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Sedang</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Rendah</span>
        </div>
      </div>

      <div className="flex-1 w-full relative h-[300px] lg:h-auto">
        {mounted && (
          <MapContainer 
            center={center} 
            zoom={11} 
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {data.map((kec) => (
              <CircleMarker
                key={kec.id}
                center={[kec.lat, kec.lng]}
                radius={Math.max(8, Math.min(24, kec.totalPengaduan / 5))}
                fillColor={getColorByPriority(kec.prioritasTindakLanjut)}
                color={getColorByPriority(kec.prioritasTindakLanjut)}
                weight={1}
                opacity={0.8}
                fillOpacity={0.4}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-1 mb-2">{kec.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px]">Total Permohonan</span>
                        <span className="font-bold text-slate-700 font-mono">{kec.totalPermohonan}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px]">Total Pengaduan</span>
                        <span className="font-bold text-rose-600 font-mono flex items-center gap-1">
                          {kec.totalPengaduan}
                          {kec.prioritasTindakLanjut === 'HIGH' && <AlertTriangle className="w-3 h-3" />}
                        </span>
                      </div>
                      <div className="flex flex-col col-span-2 mt-1">
                        <span className="text-slate-500 text-[10px]">Tingkat Kepuasan</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-mono ${kec.tingkatKepuasan >= 90 ? 'text-emerald-600' : kec.tingkatKepuasan >= 85 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {kec.tingkatKepuasan}%
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${kec.tingkatKepuasan}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
      
      {/* Global styles for leaflet popup in dark mode */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { font-family: inherit; }
        .leaflet-popup-content-wrapper { background: #ffffff; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .leaflet-popup-tip { background: #ffffff; }
        .leaflet-popup-content { margin: 12px; }
      `}} />
    </div>
  );
}
