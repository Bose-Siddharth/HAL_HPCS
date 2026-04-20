# HAL Helicopter Performance — Calculation Review Sheet

> **How to use:** For every item, tick the checkbox (`[x]`) if the value/formula is correct. If wrong, leave it unticked (`[ ]`) and write the corrected value in the **Remarks** column. Return the signed sheet to the dev team.

**Reviewer:** __________________________   **Designation:** ________________   **Date:** ____________

**App Version:** v1.0.0   **Source file:** `frontend/src/config/logic.js`

---

## 1. Aircraft Default Values

### 1.1 Chetak

| ✓ | Parameter | Unit | Default | Remarks / Correction |
|---|---|---|---|---|
| [ ] | Empty Weight | lb | 2 645 | |
| [ ] | Maximum All-Up Weight (MAUW) | lb | 4 630 | |
| [ ] | Default Crew Weight | kg | 180 | |
| [ ] | Default Fuel | litres | 575 | |
| [ ] | Default Additional Load | kg | 0 | |
| [ ] | Default Load (Pax + cargo) | kg | 75 | |
| [ ] | Default Elevation | ft | 0 | |
| [ ] | Default QNH | mb | 1 013 | |
| [ ] | Default Temperature (OAT) | °C | 15 | |

### 1.2 Cheetah

| ✓ | Parameter | Unit | Default | Remarks / Correction |
|---|---|---|---|---|
| [ ] | Empty Weight | lb | 2 469 | |
| [ ] | Maximum All-Up Weight (MAUW) | lb | 4 299 | |
| [ ] | Default Crew Weight | kg | 180 | |
| [ ] | Default Fuel | litres | 500 | |
| [ ] | Default Additional Load | kg | 0 | |
| [ ] | Default Load | kg | 75 | |
| [ ] | Default Elevation | ft | 0 | |
| [ ] | Default QNH | mb | 1 013 | |
| [ ] | Default Temperature (OAT) | °C | 15 | |

### 1.3 Cheetal

| ✓ | Parameter | Unit | Default | Remarks / Correction |
|---|---|---|---|---|
| [ ] | Empty Weight | lb | 2 756 | |
| [ ] | Maximum All-Up Weight (MAUW) | lb | 4 960 | |
| [ ] | Default Crew Weight | kg | 180 | |
| [ ] | Default Fuel | litres | 575 | |
| [ ] | Default Additional Load | kg | 0 | |
| [ ] | Default Load | kg | 75 | |
| [ ] | Default Elevation | ft | 0 | |
| [ ] | Default QNH | mb | 1 013 | |
| [ ] | Default Temperature (OAT) | °C | 15 | |

---

## 2. Input Field Units

| ✓ | Input Field | Primary Unit | Toggle | Remarks |
|---|---|---|---|---|
| [ ] | Elevation | ft | m | |
| [ ] | QNH | mb (hPa) | inHg | |
| [ ] | Temperature | °C | °F | |
| [ ] | AC Weight | lb | — | |
| [ ] | Crew Weight | kg | — | |
| [ ] | Fuel | litres | — | |
| [ ] | Additional Load | kg | — | |
| [ ] | Load (Pax + cargo) | kg | — | |

---

## 3. Calculation Formulas

### [ ] 3.1 Pressure Altitude (PA) — output: **ft**
```
PA = elevation + (1013 − qnh) × 30
```
*variables:* `elevation` (ft), `qnh` (mb)

**Remarks / corrected formula:**
_______________________________________________________________________

---

### [ ] 3.2 ISA Temperature — output: **°C**
```
ISA_TEMP = 15 − (elevation / 1000) × 2
```
*variables:* `elevation` (ft)

**Remarks / corrected formula:**
_______________________________________________________________________

---

### [ ] 3.3 Density Altitude (DA) — output: **ft**
```
DA = PA + 120 × (OAT − ISA_TEMP)
```
*variables:* `pa` (ft), `oat` (°C), `isa` (°C)

**Remarks / corrected formula:**
_______________________________________________________________________

---

### [ ] 3.4 Absolute Temperature — output: **Kelvin**
```
ABS_TEMP = 273 + OAT
```
*variables:* `oat` (°C)

**Remarks / corrected formula:**
_______________________________________________________________________

---

### [ ] 3.5 All Up Weight (AUW) — output: **lb**
```
AUW = ac_weight + (crew × 2.2) + (fuel × 0.775 × 2.2) + (add_load × 2.2) + (load × 2.2)
```
*variables:* `ac_weight` (lb), `crew` (kg), `fuel` (litres), `add_load` (kg), `load` (kg)
*factors:* `2.2` = kg→lb conversion · `0.775` = aviation-fuel density (kg / litre)

**Remarks / corrected formula:**
_______________________________________________________________________

---

### [ ] 3.6 Power Available (Max Pwr) — output: **fraction 0..1 (capped at 1.0)**
```
POWER_AVAIL = min(1.0, ((DA / 660) × 0.01) + 0.75)
```
*variables:* `density_alt` (ft)

**Remarks / corrected formula:**
_______________________________________________________________________

---

### [ ] 3.7 Power Required (Hover Pwr) — output: **fraction**
```
POWER_REQ = (AUW / 6600) × (1013 / QNH) × (ABS_TEMP / 288)
```
*variables:* `auw` (lb), `qnh` (mb), `abs_temp` (K)

**Remarks / corrected formula:**
_______________________________________________________________________

---

## 4. Derived Quantities & Presentation

| ✓ | Quantity | Unit | Formula | Remarks |
|---|---|---|---|---|
| [ ] | Power Balance % | % | `(Pwr_Avail − Pwr_Req) / Pwr_Avail × 100` | |
| [ ] | AUW Margin | lb | `MAUW − AUW` | |
| [ ] | Payload Margin | lb | `min(AUW_Margin, AUW × pwr_headroom)` | |

---

## 5. Fit-to-Fly Thresholds (0.01 precision)

| ✓ | Rule | Condition for **NOT FIT** | Remarks / Corrected rule |
|---|---|---|---|
| [ ] | Weight check | `AUW − MAUW > 0.01 lb` | |
| [ ] | Power check | `POWER_REQ − POWER_AVAIL > 0.01` | |
| [ ] | Service ceiling | `DA > 18 000 ft` | |

---

## 6. Sample Calculations (please verify numerically)

### Case A — Chetak, Sea-Level ISA
**Inputs:** Elevation 0 ft · QNH 1013 · Temp 15 °C · AC Weight 2 645 lb · Crew 180 kg · Fuel 575 L · Load 75 kg · Add 0

| Parameter | Expected |
|---|---|
| PA | 0 ft |
| ISA Temp | 15 °C |
| DA | 0 ft |
| Abs Temp | 288 K |
| AUW | 4 186.38 lb |
| Power Available | 0.750 |
| Power Required | 0.634 |
| **Status** | **FIT** (+15 %) |

Reviewer correction (if any): _______________________________________________________

---

### Case B — Chetak, 10 000 ft · 30 °C
**Inputs:** Elevation 10 000 ft · QNH 1013 · Temp 30 °C · AC Weight 2 645 lb · Crew 180 kg · Fuel 575 L · Load 200 kg · Add 0

| Parameter | Expected |
|---|---|
| PA | 10 000 ft |
| ISA Temp | −5 °C |
| DA | 14 200 ft |
| Abs Temp | 303 K |
| AUW | 4 461.38 lb |
| Power Available | 0.965 |
| Power Required | 0.711 |
| **Status** | **FIT** (+26 %) |

Reviewer correction (if any): _______________________________________________________

---

## 7. Overall Review Comments

_______________________________________________________________________

_______________________________________________________________________

_______________________________________________________________________

_______________________________________________________________________

---

**Reviewer Signature:** ____________________________   **Date:** ____________
