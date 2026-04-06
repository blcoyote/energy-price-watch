import { useEffect, useRef, useState } from 'react'
import {
  ElectricityPriceChart,
  useElectricityPrices,
  useElectricityTariff,
  useDanishDateWindow,
  toKwh,
  GRID_COMPANIES,
} from '@features/electricity-prices'
import type { DayAheadPricesQueryParams, SelectedPriceEntry } from '@features/electricity-prices'
import './App.css'

const PRICE_AREA_LABELS: Record<'DK1' | 'DK2', string> = {
  DK1: 'DK Vest',
  DK2: 'DK Øst',
}

function ElectricityPricesPanel() {
  const [priceArea, setPriceArea] = useState<'DK1' | 'DK2'>('DK1')
  const [includeTariff, setIncludeTariff] = useState(true)

  // Automatically pick the first DSO for the selected price area
  const areaGln = GRID_COMPANIES.find(c => c.area === priceArea)?.gln ?? GRID_COMPANIES[0].gln

  const { start, end, displayDay, tomorrowAvailable, currentDkHour } = useDanishDateWindow()

  const params: DayAheadPricesQueryParams = {
    priceArea,
    start,
    end,
  }

  const { data, isPending, isError, error } = useElectricityPrices(params)
  const { data: tariffData, isPending: tariffPending } = useElectricityTariff(
    includeTariff ? areaGln : null,
  )

  const headingLabel = tomorrowAvailable ? `I morgen — ${displayDay}` : `I dag — ${displayDay}`
  const subLabel = tomorrowAvailable
    ? 'Kommende day-ahead priser (offentliggjort efter kl. 13:00)'
    : 'Dagens priser — morgendagens vises efter kl. 13:00'


  // Selected bar — defaults to the current-hour bar once data is available
  const [selectedEntry, setSelectedEntry] = useState<SelectedPriceEntry | null>(null)
  const initialised = useRef(false)
  useEffect(() => {
    if (initialised.current) return
    if (!data || data.length === 0) return
    if (currentDkHour == null) return
    const defaultEntry = data.find(
      d => parseInt(d.timestamp.slice(11, 13), 10) === currentDkHour,
    )
    if (defaultEntry) {
      initialised.current = true
      const tariffVal = tariffData != null ? (tariffData[currentDkHour] ?? 0) : 0
      const spot = toKwh(defaultEntry.priceDKK)
      setSelectedEntry({
        time: defaultEntry.time,
        timestamp: defaultEntry.timestamp,
        spotDKK: spot,
        tariffDKK: tariffVal,
        totalDKK: Math.round((spot + tariffVal) * 100) / 100,
      })
    }
  }, [data, tariffData, currentDkHour])

  const priceBoxHour = selectedEntry ? parseInt(selectedEntry.timestamp.slice(11, 13), 10) : 0
  const liveTariff = selectedEntry && tariffData != null ? (tariffData[priceBoxHour] ?? 0) : 0
  const liveTotal = selectedEntry ? Math.round((selectedEntry.spotDKK + liveTariff) * 100) / 100 : 0

  return (
    <section className="prices-panel">
      <div className="prices-header">
        <h1 className="prices-title">⚡ Day-ahead priser · {headingLabel}</h1>
        <p className="prices-subtitle">
          {subLabel} ·{' '}
          <a href="https://www.energidataservice.dk/tso-electricity/DayAheadPrices" target="_blank" rel="noreferrer">Energi Data Service</a>
        </p>
      </div>

      <div className="controls">
        <fieldset className="control-group">
          <legend>Priszone</legend>
          <div className="radio-group">
            {(['DK1', 'DK2'] as const).map(area => (
              <label key={area} className="radio-label">
                <input
                  type="radio"
                  name="priceArea"
                  value={area}
                  checked={priceArea === area}
                  onChange={() => setPriceArea(area)}
                />{' '}
                {PRICE_AREA_LABELS[area]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="control-group">
          <legend>Tariffer</legend>
          <label className="switch-label">
            <input
              type="checkbox"
              role="switch"
              aria-checked={includeTariff}
              checked={includeTariff}
              onChange={e => setIncludeTariff(e.target.checked)}
              className="switch-input"
            />
            Inkluder tariffer
          </label>
        </fieldset>

        {selectedEntry && (
          <fieldset className="control-group price-box">
            <legend>{selectedEntry.time}</legend>
            <div className="price-box-row">
              <span className="price-box-label">Spot</span>
              <span className="price-box-value">{selectedEntry.spotDKK.toFixed(2)} DKK/kWh</span>
            </div>
            {includeTariff && (
              <div className="price-box-row price-box-total">
                <span className="price-box-label">Total</span>
                <span className="price-box-value">{liveTotal.toFixed(2)} DKK/kWh</span>
              </div>
            )}
          </fieldset>
        )}
      </div>

      {isPending && <p className="status-msg">Henter priser…</p>}
      {includeTariff && tariffPending && <p className="status-msg">Henter tariffer…</p>}
      {isError && (
        <p className="status-msg status-error">
          Kunne ikke hente priser: {error instanceof Error ? error.message : 'Ukendt fejl'}
        </p>
      )}
      {data && data.length === 0 && <p className="status-msg">Ingen data tilgængeligt for den valgte periode.</p>}

      {data && data.length > 0 && (
        <ElectricityPriceChart
          data={data}
          tariff={includeTariff ? tariffData : undefined}
          currentDkHour={currentDkHour}
          selectedTimestamp={selectedEntry?.timestamp}
          onBarClick={setSelectedEntry}
        />
      )}
    </section>
  )
}

export default function App() {
  return (
      <ElectricityPricesPanel />
  )
}
