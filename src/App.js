import './App.css'
import { useContext, useState } from 'react'
import MapContext from './Map/MapContext'

function App() {
  const { map } = useContext(MapContext)

  return (
    <>
      <div id="map" style={{ position: 'relative', width: '100%', height: '100%' }}>
      </div>
    <script src="https://cdn.jsdelivr.net/npm/elm-pep@1.0.6/dist/elm-pep.js"></script>
    <script type="module" src="./Map/Map.jsx"></script>
    </>
  )
}

export default App;