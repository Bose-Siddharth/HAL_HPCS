import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Generates a professional HAL Report PDF from the calculation payload
 * and opens the native share sheet.
 */
export const generateAndSharePdf = async (report) => {
  const { name, created_at, aircraft, inputs, outputs, units } = report;
  const statusColor = outputs.status === 'FIT' ? '#22C55E' : '#EF4444';
  const statusText = outputs.status === 'FIT' ? 'WITHIN LIMITS / FIT TO FLY' : 'LIMIT EXCEEDED / NOT FIT TO FLY';
  const reasonsList = (outputs.reasons || []).map((r) => `<li>${r}</li>`).join('') || '<li>All parameters within safe envelope.</li>';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color:#0F172A; padding:32px; }
      .header { border-bottom: 4px solid #1EA7E8; padding-bottom: 12px; margin-bottom: 18px; }
      h1 { margin:0; font-size: 28px; color:#0F172A; letter-spacing:-0.5px; }
      .sub { color:#64748B; font-size:12px; margin-top:4px; }
      .chip { display:inline-block; padding:8px 16px; border-radius:24px; color:#fff; font-weight:700; font-size:14px; background:${statusColor}; }
      h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color:#64748B; margin:24px 0 10px; }
      table { width:100%; border-collapse: collapse; font-size:13px; }
      td, th { padding:8px 10px; border-bottom: 1px solid #E2E8F0; text-align:left; }
      th { background:#F1F5F9; font-weight:700; }
      .grid { display:flex; flex-wrap: wrap; gap: 10px; }
      .card { flex:1 1 45%; border:1px solid #E2E8F0; border-radius:10px; padding:12px; }
      .card .k { font-size: 11px; color:#64748B; text-transform:uppercase; letter-spacing:1px; }
      .card .v { font-size: 22px; font-weight:800; color:#0F172A; }
      .foot { margin-top: 36px; font-size: 10px; color:#94A3B8; border-top:1px solid #E2E8F0; padding-top:8px; }
      ul { margin: 4px 0 0 18px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>HAL Report</h1>
      <div class="sub">Hindustan Aeronautics Limited &middot; Helicopter Performance System</div>
      <div class="sub">Report: <b>${name}</b> &middot; Generated: ${new Date(created_at).toLocaleString()}</div>
    </div>

    <div class="chip">${statusText}</div>

    <h2>Aircraft & Environment</h2>
    <table>
      <tr><th>Aircraft Type</th><td>${aircraft.name}</td><th>MAUW</th><td>${aircraft.mauw} kg</td></tr>
      <tr><th>Elevation</th><td>${inputs.elevation} ft</td><th>QNH</th><td>${inputs.qnh} hPa</td></tr>
      <tr><th>Temperature (OAT)</th><td>${inputs.temperature} °C</td><th>Rated Power</th><td>${aircraft.ratedPowerSHP} shp</td></tr>
    </table>

    <h2>Weights (kg)</h2>
    <table>
      <tr><th>AC Empty</th><td>${inputs.acWeight}</td><th>Crew</th><td>${inputs.crewWeight}</td></tr>
      <tr><th>Fuel</th><td>${inputs.fuel}</td><th>Payload</th><td>${inputs.payload}</td></tr>
      <tr><th>Additional Load</th><td>${inputs.additionalLoad}</td><th>All Up Weight</th><td><b>${outputs.AUW}</b></td></tr>
    </table>

    <h2>Computed Performance</h2>
    <div class="grid">
      <div class="card"><div class="k">Pressure Altitude</div><div class="v">${outputs.PA} ft</div></div>
      <div class="card"><div class="k">ISA Temperature</div><div class="v">${outputs.ISA_TEMP} °C</div></div>
      <div class="card"><div class="k">Density Altitude</div><div class="v">${outputs.DENSITY_ALT} ft</div></div>
      <div class="card"><div class="k">Air Density</div><div class="v">${outputs.DENSITY} kg/m³</div></div>
      <div class="card"><div class="k">AB Temperature</div><div class="v">${outputs.AB_TEMP} °C</div></div>
      <div class="card"><div class="k">All Up Weight</div><div class="v">${outputs.AUW} kg</div></div>
      <div class="card"><div class="k">Power Available</div><div class="v">${outputs.POWER_AVAIL} shp</div></div>
      <div class="card"><div class="k">Power Required</div><div class="v">${outputs.POWER_REQ} shp</div></div>
    </div>

    <h2>Fit-to-Fly Evaluation</h2>
    <ul>${reasonsList}</ul>

    <div class="foot">Units: alt=${units.altitude}, temp=${units.temperature}, weight=${units.weight}, pressure=${units.pressure}. Computed locally on device, fully offline.</div>
  </body>
  </html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (Platform.OS === 'web') {
    // On web, trigger download of PDF via anchor (expo-print returns blob URL on web)
    if (typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = uri;
      a.download = `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    return uri;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share HAL Report' });
  }
  return uri;
};
