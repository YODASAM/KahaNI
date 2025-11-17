import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Simple Heatmap Component using official leaflet.heat
function HeatmapLayerComponent({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heat = L.heatLayer(points, {
      radius: 35,
      blur: 30,
      maxZoom: 10,
      gradient: { 0.4: '#00f', 0.65: '#0f0', 1: '#f00' }
    }).addTo(map);
    return () => map.removeLayer(heat);
  }, [points, map]);
  return null;
}

export default function App() {
  const [mode, setMode] = useState('home');
  const [qrData, setQrData] = useState(null);
  const [hybridQr, setHybridQr] = useState(null);

  // Mock payment data
  const paymentHeat = [
    [28.6139, 77.2090, 25],
    [19.0760, 72.8777, 18],
    [13.0827, 80.2707, 12],
    [12.9716, 77.5946, 15],
  ];
  const coverageHeat = [[28.7041, 77.1025, 10]];
  const heatPoints = paymentHeat.length > 0 ? paymentHeat : coverageHeat;

  const generateHybridQR = () => {
    if (!qrData) return;
    const mock = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAoQAAAABJRU5ErkJggg==";
    setHybridQr(mock);
  };

  const startScan = () => {
    setMode('scanning');
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 280 }, false);
      scanner.render(
        (result) => {
          setQrData(result);
          scanner.clear();
          setMode('result');
        },
        () => {}
      );
    }, 100);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await Html5QrcodeScanner.scanFileV2(file, false);
      setQrData(result.decodedText);
      setMode('result');
    } catch {
      alert('No QR found');
      setMode('home');
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2.8rem', marginBottom: 30 }}>
        Geo-QR Enterprise
      </h1>

      {mode === 'home' && (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <h2 style={{ marginBottom: 40 }}>Choose your QR input method</h2>
          <div style={{ display: 'flex', gap: 50, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={startScan} style={{ padding: '60px 80px', fontSize: '24px', background: '#4361ee', color: 'white', border: 'none', borderRadius: 20 }}>
              📷 Camera Scan
            </button>
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <div style={{ padding: '60px 80px', fontSize: '24px', background: '#7209b7', color: 'white', borderRadius: 20 }}>
                🖼️ Upload Image
              </div>
            </label>
          </div>
        </div>
      )}

      {mode === 'scanning' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Scanning...</h2>
          <div id="reader" style={{ width: '100%', maxWidth: 520, margin: '30px auto' }}></div>
        </div>
      )}

      {mode === 'result' && !hybridQr && (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <h2>QR Detected!</h2>
          <p style={{ fontSize: 20, background: '#f0f0f0', padding: 20, borderRadius: 12 }}>
            <strong>{qrData}</strong>
          </p>
          <button onClick={generateHybridQR} style={{ padding: '18px 50px', fontSize: 22, background: '#06d6a0', color: 'white', border: 'none', borderRadius: 16 }}>
            Generate Geo-Locked QR
          </button>
        </div>
      )}

      {hybridQr && (
        <div>
          <h2 style={{ textAlign: 'center', margin: '40px 0' }}>Your Geo-Locked Hybrid QR</h2>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <img src={`data:image/png;base64,${hybridQr}`} alt="Geo QR" style={{ width: 320, border: '8px solid #4361ee', borderRadius: 20 }} />
          </div>

          <h3 style={{ textAlign: 'center' }}>Live Payment Heatmap</h3>
          <MapContainer center={[20, 77]} zoom={5} style={{ height: '70vh', borderRadius: 20, marginTop: 20 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatmapLayerComponent points={heatPoints} />
            <CircleMarker center={[28.7041, 77.1025]} radius={30} color="#c9a227" fillOpacity={0.9}>
              <Popup>Delhi Geo-Fence</Popup>
            </CircleMarker>
          </MapContainer>

          <div style={{ textAlign: 'center', margin: 40 }}>
            <button onClick={() => { setHybridQr(null); setMode('home'); }}>
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}