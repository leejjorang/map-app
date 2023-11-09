import './App.css'
import { useContext, useState } from 'react'
import MapContext from './Map/MapContext'

function App() {
  const { map } = useContext(MapContext)

  return (
    <>
      <div id="map" style={{ position: 'relative', width: '100%', height: '100%' }}>
      </div>
    </>
  )
}

export default App;