import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function App() {
  const [mode, setMode] = useState('home'); // home | scanning | uploading | result
  const [qrData, setQrData] = useState(null);
  const [hybridQr, setHybridQr] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Mock real payment data (replace with backend later)
  const paymentHeat = [
    [28.6139, 77.2090, 15], // Delhi
    [19.0760, 72.8777, 12], // Mumbai
    [13.0827, 80.2707, 8],  // Chennai
    [12.9716, 77.5946, 6],  // Bangalore
  ];

  const coverageHeat = [[28.7041, 77.1025, 10]]; // fallback

  const heatPoints = paymentHeat.length > 0 ? paymentHeat : coverageHeat;

  // Generate Hybrid QR (mock)
  const generateHybridQR = async () => {
    if (!qrData) return;
    // In real app: call your /api/pay
    const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAoQAAAABJRU5ErkJggg==";
    setHybridQr(mockBase64);
    setShowHeatmap(true);
  };

  // Start Camera Scanner
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

  // Upload QR Image
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#1a1a1a', fontSize: '2.5em' }}>
        Geo-QR Enterprise
      </h1>

      {/* HOME: Two Big Buttons */}
      {mode === 'home' && (
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <h2 style={{ color: '#333' }}>How do you want to add your QR?</h2>
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '50px', flexWrap: 'wrap' }}>
            <button
              onClick={startScan}
              style={{
                padding: '50px 70px',
                fontSize: '22px',
                background: '#4361ee',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(67,97,238,0.3)'
              }}
            >
              📷 Scan with Camera
            </button>

            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <div style={{
                padding: '50px 70px',
                fontSize: '22px',
                background: '#7209b7',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(114,9,183,0.3)'
              }}>
                🖼️ Upload QR Image
              </div>
            </label>
          </div>
        </div>
      )}

      {/* SCANNING */}
      {mode === 'scanning' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Scanning Live...</h2>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '20px auto' }}></div>
          <button onClick={() => setMode('home')} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Cancel
          </button>
        </div>
      )}

      {/* RESULT: Generate Hybrid */}
      {mode === 'result' && !hybridQr && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>QR Detected!</h2>
          <p style={{ fontSize: '18px', background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
            <strong>{qrData}</strong>
          </p>
          <button
            onClick={generateHybridQR}
            style={{ marginTop: '20px', padding: '15px 40px', fontSize: '20px', background: '#06d6a0', color: 'white', border: 'none', borderRadius: '12px' }}
          >
            Generate Geo-Locked QR
          </button>
        </div>
      )}

      {/* HYBRID QR + HEATMAP */}
      {hybridQr && (
        <div>
          <h2 style={{ textAlign: 'center', margin: '30px 0' }}>Your Geo-Locked Hybrid QR</h2>
          <div style={{ textAlign: 'center' }}>
            <img
              src={`data:image/png;base64,${hybridQr}`}
              alt="Geo QR"
              style={{ width: '300px', border: '6px solid #4361ee', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
            />
          </div>
          <p style={{ textAlign: 'center', margin: '20px', color: '#666' }}>
            This QR only works within 100km of Delhi
          </p>

          <h3 style={{ textAlign: 'center', margin: '40px 0 20px' }}>
            {paymentHeat.length > 0 ? '🔥 Live Payment Heatmap' : 'Coverage Area'}
          </h3>

          <MapContainer center={[20, 77]} zoom={5} style={{ height: '70vh', borderRadius: '16px', overflow: 'hidden' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatmapLayer
              points={heatPoints}
              longitudeExtractor={m => m[1]}
              latitudeExtractor={m => m[0]}
              intensityExtractor={m => m[2]}
              radius={30}
              blur={25}
              max={15}
            />
            <CircleMarker center={[28.7041, 77.1025]} radius={25} color="#c9a227" fillOpacity={0.8}>
              <Popup>Delhi Geo-Fence Center</Popup>
            </CircleMarker>
          </MapContainer>

          <div style={{ textAlign: 'center', margin: '30px' }}>
            <button onClick={() => { setHybridQr(null); setMode('home'); setShowHeatmap(false); }}>
              Create New Geo-QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
