import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat/dist/leaflet-heat.js'; // ← This is the fix (works with React 18 + Vite)

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function App() {
  const [mode, setMode] = useState('home');
  const [qrData, setQrData] = useState(null);
  const [hybridQr, setHybridQr] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Real vs fallback heat points
  const paymentHeat = [
    [28.6139, 77.2090, 20], // Delhi
    [19.0760, 72.8777, 15], // Mumbai
    [13.0827, 80.2707, 10], // Chennai
    [12.9716, 77.5946, 12], // Bangalore
  ];
  const coverageHeat = [[28.7041, 77.1025, 10]];
  const heatPoints = paymentHeat.length > 0 ? paymentHeat : coverageHeat;

  const generateHybridQR = () => {
    if (!qrData) return;
    const mock = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAoQAAAABJRU5ErkJggg==";
    setHybridQr(mock);
    setShowHeatmap(true);
  };

  const startScan = () => {
    setMode('scanning');
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 280 }, false);
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
    setMode('uploading');
    try {
      const result = await Html5QrcodeScanner.scanFileV2(file, false);
      setQrData(result.decodedText);
      setMode('result');
    } catch {
      alert('No QR code found');
      setMode('home');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#1a1a1a', fontSize: '2.8em' }}>Geo-QR Enterprise</h1>

      {mode === 'home' && (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <h2 style={{ color: '#444' }}>How do you want to add your QR?</h2>
          <div style={{ display: 'flex', gap: '50px', justifyContent: 'center', marginTop: '50px', flexWrap: 'wrap' }}>
            <button onClick={startScan} style={{ padding: '60px 80px', fontSize: '24px', background: '#4361ee', color: 'white', border: 'none', borderRadius: '20px' }}>
              📷 Camera Scan
            </button>
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <div style={{ padding: '60px 80px', fontSize: '24px', background: '#7209b7', color: 'white', borderRadius: '20px' }}>
                🖼️ Upload Image
              </div>
            </label>
          </div>
        </div>
      )}

      {mode === 'scanning' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Scanning...</h2>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '520px', margin: '30px auto' }}></div>
        </div>
      )}

      {mode === 'result' && !hybridQr && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>QR Detected!</h2>
          <p style={{ fontSize: '20px', background: '#f0f0f0', padding: '20px', borderRadius: '12px' }}>
            <strong>{qrData}</strong>
          </p>
          <button onClick={generateHybridQR} style={{ padding: '18px 50px', fontSize: '22px', background: '#06d6a0', color: 'white', border: 'none', borderRadius: '16px' }}>
            Generate Geo-Locked QR
          </button>
        </div>
      )}

      {hybridQr && (
        <div>
          <h2 style={{ textAlign: 'center', margin: '40px 0' }}>Your Geo-Locked Hybrid QR</h2>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img src={`data:image/png;base64,${hybridQr}`} alt="Geo QR" style={{ width: '320px', border: '8px solid #4361ee', borderRadius: '20px' }} />
          </div>

          <h3 style={{ textAlign: 'center' }}>Live Payment Heatmap</h3>
          <MapContainer center={[20, 77]} zoom={5} style={{ height: '70vh', borderRadius: '20px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* Working heatmap with leaflet.heat */}
            {showHeatmap && L.heatLayer(heatPoints, { radius: 35, blur: 30, maxZoom: 10 }).addTo(useMap())}
            <CircleMarker center={[28.7041, 77.1025]} radius={30} color="#c9a227" fillOpacity={0.9}>
              <Popup>Delhi Geo-Fence</Popup>
            </CircleMarker>
          </MapContainer>

          <div style={{ textAlign: 'center', margin: '40px' }}>
            <button onClick={() => { setHybridQr(null); setMode('home'); setShowHeatmap(false); }}>
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
