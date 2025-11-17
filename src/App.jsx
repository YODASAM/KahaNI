import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
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
  const [payments, setPayments] = useState([]); // real payments
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Mock payment data (replace with real backend later)
  useEffect(() => {
    // Simulate some payments
    const mockPayments = [
      [28.6139, 77.2090, 5],  // Delhi
      [19.0760, 72.8777, 8],  // Mumbai
      [13.0827, 80.2707, 3],  // Chennai
    ];
    setPayments(mockPayments);
  }, []);

  // Generate Hybrid Geo QR
  const generateHybridQR = async () => {
    if (!qrData) return;
    const [vpa] = qrData.split(',');
    const geoPayload = `geo:28.7041,77.1025,100km?vpa=${vpa}`;
    
    // In real app: call backend to generate QR with geo + payment intent
    const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAoQAAAABJRU5ErkJggg==";
    setHybridQr(mockBase64);
    setShowHeatmap(true);
  };

  // Start Camera Scanner
  const startScan = () => {
    setMode('scanning');
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false);
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
    } catch (err) {
      alert('No QR found in image');
      setMode('home');
    }
  };

  // Heatmap Points
  const heatPoints = payments.length > 0 
    ? payments 
    : [[28.7041, 77.1025, 10]]; // fallback coverage

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1a1a1a' }}>Geo-QR Enterprise</h1>

      {/* HOME SCREEN - Two Big Buttons */}
      {mode === 'home' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2>How would you like to add your QR?</h2>
          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
            <button 
              onClick={startScan}
              style={{ padding: '40px 60px', fontSize: '20px', background: '#4361ee', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
            >
              📷 Scan with Camera
            </button>
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <div style={{ padding: '40px 60px', fontSize: '20px', background: '#7209b7', color: 'white', borderRadius: '12px' }}>
                🖼️ Upload QR Image
              </div>
            </label>
          </div>
        </div>
      )}

      {/* SCANNING */}
      {mode === 'scanning' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Scanning...</h2>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}></div>
          <button onClick={() => setMode('home')} style={{ marginTop: '20px' }}>Back</button>
        </div>
      )}

      {/* RESULT */}
      {mode === 'result' && !hybridQr && (
        <div style={{ textAlign: 'center' }}>
          <h2>QR Detected!</h2>
          <p><strong>{qrData}</strong></p>
          <button onClick={generateHybridQR} style={{ padding: '15px 40px', fontSize: '18px', background: '#06d6a0' }}>
            Generate Geo-Locked QR
          </button>
        </div>
      )}

      {/* HYBRID QR + HEATMAP */}
      {hybridQr && (
        <div>
          <h2 style={{ textAlign: 'center' }}>Your Geo-Locked Hybrid QR</h2>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <img src={`data:image/png;base64,${hybridQr}`} alt="Geo QR" style={{ width: '280px', border: '4px solid #4361ee', borderRadius: '12px' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
            This QR only works within 100km of Delhi
          </p>

          <h3 style={{ textAlign: 'center', marginTop: '40px' }}>
            {payments.length > 0 ? '🔥 Live Payment Heatmap' : 'Coverage Heatmap'}
          </h3>
          <MapContainer center={[20, 77]} zoom={5} style={{ height: '70vh', width: '100%', borderRadius: '12px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatmapLayer
              points={heatPoints}
              longitudeExtractor={(p) => p[1]}
              latitudeExtractor={(p) => p[0]}
              intensityExtractor={(p) => p[2]}
              radius={25}
              blur={20}
            />
            <CircleMarker center={[28.7041, 77.1025]} radius={20} color="#c9a227" fillOpacity={0.8}>
              <Popup>Delhi Geo-Fence</Popup>
            </CircleMarker>
          </MapContainer>

          <div style={{ textAlign: 'center', margin: '20px' }}>
            <button onClick={() => { setHybridQr(null); setMode('home'); }}>Create Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
