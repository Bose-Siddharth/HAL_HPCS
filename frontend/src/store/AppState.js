/**
 * Global app state: selected aircraft, live config (formulas + defaults),
 * current inputs, computed outputs. Backed by SQLite for persistence.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_AIRCRAFT,
  DEFAULT_FORMULAS,
  computePerformance,
} from '../config/logic';
import {
  loadAircraftDefaults,
  loadFormulas,
  saveAircraftDefaults,
  saveFormulas,
} from '../db/database';

const Ctx = createContext(null);

export const AppStateProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [aircraftDefaults, setAircraftDefaults] = useState(DEFAULT_AIRCRAFT);
  const [formulas, setFormulas] = useState(DEFAULT_FORMULAS);
  const [selectedAircraftId, setSelectedAircraftId] = useState('chetak');
  const [units, setUnits] = useState({
    altitude: 'ft',
    temperature: 'C',
    weight: 'kg',
    pressure: 'hPa',
  });
  const [inputs, setInputsState] = useState({
    elevation: 0,
    qnh: 1013.25,
    temperature: 15,
    acWeight: DEFAULT_AIRCRAFT.chetak.emptyWeight,
    crewWeight: DEFAULT_AIRCRAFT.chetak.defaultCrew,
    fuel: DEFAULT_AIRCRAFT.chetak.defaultFuel,
    additionalLoad: DEFAULT_AIRCRAFT.chetak.defaultAddLoad,
    payload: DEFAULT_AIRCRAFT.chetak.defaultPayload,
  });

  useEffect(() => {
    (async () => {
      try {
        const [ad, f] = await Promise.all([loadAircraftDefaults(), loadFormulas()]);
        setAircraftDefaults(ad);
        setFormulas(f);
        const d = ad[selectedAircraftId];
        setInputsState({
          elevation: d.defaultElevation,
          qnh: d.defaultQNH,
          temperature: d.defaultTemp,
          acWeight: d.emptyWeight,
          crewWeight: d.defaultCrew,
          fuel: d.defaultFuel,
          additionalLoad: d.defaultAddLoad,
          payload: d.defaultPayload,
        });
      } catch (e) {
        console.warn('DB load failed, using defaults', e);
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh inputs when aircraft selection changes
  useEffect(() => {
    if (!ready) return;
    const d = aircraftDefaults[selectedAircraftId];
    setInputsState((prev) => ({
      ...prev,
      acWeight: d.emptyWeight,
      crewWeight: d.defaultCrew,
      fuel: d.defaultFuel,
      additionalLoad: d.defaultAddLoad,
      payload: d.defaultPayload,
    }));
  }, [selectedAircraftId, aircraftDefaults, ready]);

  const setInputs = (v) => setInputsState((prev) => ({ ...prev, ...v }));

  const setUnit = (k, v) => setUnits((prev) => ({ ...prev, [k]: v }));

  const updateAircraftDefaults = async (d) => {
    setAircraftDefaults(d);
    await saveAircraftDefaults(d);
  };

  const updateFormulas = async (f) => {
    setFormulas(f);
    await saveFormulas(f);
  };

  const resetInputsToDefaults = () => {
    const d = aircraftDefaults[selectedAircraftId];
    setInputsState({
      elevation: d.defaultElevation,
      qnh: d.defaultQNH,
      temperature: d.defaultTemp,
      acWeight: d.emptyWeight,
      crewWeight: d.defaultCrew,
      fuel: d.defaultFuel,
      additionalLoad: d.defaultAddLoad,
      payload: d.defaultPayload,
    });
  };

  const outputs = useMemo(() => {
    const ac = aircraftDefaults[selectedAircraftId];
    return computePerformance({ aircraft: ac, ...inputs }, formulas);
  }, [aircraftDefaults, selectedAircraftId, inputs, formulas]);

  const value = {
    ready,
    aircraftDefaults,
    formulas,
    selectedAircraftId,
    setSelectedAircraftId,
    inputs,
    setInputs,
    units,
    setUnit,
    outputs,
    updateAircraftDefaults,
    updateFormulas,
    resetInputsToDefaults,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAppState = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be inside AppStateProvider');
  return v;
};
