import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function App() {
  const [qrData, setQrData] = useState(null);
  const [scannedText, setScannedText] = useState(''); // for debugging

  // ───────────── QR SCANNER (Camera + File Upload) ─────────────
  useEffect(() => {
    if (!qrData) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [0, 1, 2], // QR, DataMatrix, etc.
      });

      scanner.render(
        (result) => {
          console.log('QR Scanned:', result);
          setScannedText(result);
          setQrData(result); // your original logic uses this
          scanner.clear();
        },
        (err) => {
          // Silently ignore scanning errors
        }
      );

      return () => scanner.clear();
    }
  }, [qrData]);

  // ───────────── FILE UPLOAD (for image QR) ─────────────
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target.result;
      try {
        const result = await Html5QrcodeScanner.scanFileV2(file, false);
        setScannedText(result.decodedText);
        setQrData(result.decodedText);
      } catch (err) {
        alert('No QR code found in image');
      }
    };
    reader.readAsDataURL(file);
  };

  // ───────────── GENERATE HYBRID QR ─────────────
  const generateQR = async () => {
    if (!qrData) return;
    const [vpa, amount] = qrData.split(','); // simple split as before
    const geo = 'gh:28.7041,77.1025,100km';

    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vpa, amount, lat: 28.7041, lon: 77.1025, radius: 100 }),
      });
      const json = await res.json();
      setQrData(json.qr); // hybrid QR data
    } catch (err) {
      alert('Failed to generate hybrid QR');
    }
  };

  return (
    <div className="container">
      <h1 className="pulse">Geo-QR Enterprise</h1>

      {!qrData ? (
        <div>
          <h2>Scan or Upload Your PhonePe/BharatPe QR</h2>

          {/* Camera scanner */}
          <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}></div>

          {/* File upload */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={handleFile} />
            <p style={{ fontSize: '0.9em', color: '#666' }}>
              Or upload a QR image
            </p>
          </div>

          {scannedText && (
            <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
              <strong>Detected:</strong> {scannedText}
              <button onClick={generateQR} style={{ marginLeft: '10px' }}>
                Generate Hybrid QR
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2>Hybrid QR Generated</h2>
          <img src={`data:image/png;base64,${qrData}`} alt="Hybrid QR" style={{ maxWidth: '300px' }} />
          <br />
          <button onClick={() => setQrData(null)} style={{ marginTop: '20px' }}>
            Scan Another
          </button>
        </div>
      )}

      {/* Map */}
      <MapContainer center={[20, 77]} zoom={5} style={{ height: '80vh', width: '100%', marginTop: '20px' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={[28.7041, 77.1025]} radius={100000} color="#c9a227" fillOpacity={0.5} />
      </MapContainer>

      <button onClick={() => window.open('/api/export', '_blank')} style={{ margin: '20px' }}>
        Export CSV
      </button>
    </div>
  );
}