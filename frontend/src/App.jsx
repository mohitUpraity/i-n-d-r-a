import {BrowserRouter as Router , Routes , Route , Link} from 'react-router-dom';
import AuthCitizen from '../pages/Auth-Citizen';
import AuthOperator from '../pages/Auth-Operator';
import IndraLanding from '../pages/LandingPage';
const App = () => {
  return (
<Router>
  <Routes>
    <Route path='/' element = {<IndraLanding/>} />
    <Route path='/auth/citizen' element = {<AuthCitizen/>} />
    <Route path='/auth/operator' element = {<AuthOperator/>} />
  </Routes>
</Router>
  )
}

export default App
