import './App.css'
import { useContext } from 'react'
import MapContext from './Map/MapContext'

function App() {
  const { map } = useContext(MapContext)
  return (
    <>
      <div id="map" style={{ position: 'relative', width: '100%', height: 'calc(100% - 59px - 50px)' }}>
      </div>
    </>
  )
}

export default App;