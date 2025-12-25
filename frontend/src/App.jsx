import {BrowserRouter as Router , Routes , Route , Link} from 'react-router-dom';
import Auth from '../pages/Auth';
import LandingPage from '../pages/LandingPage';
const App = () => {
  return (
<Router>
  <Routes>
    <Route path='/' element = {<LandingPage/>} />
    <Route path='/auth' element = {<Auth/>} />
  </Routes>
</Router>
  )
}

export default App
