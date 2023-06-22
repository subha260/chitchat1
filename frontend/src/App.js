import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router,Route,Switch} from "react-router-dom";
import Login from './componets/Login';
import Register from './componets/Register';
import Messenger from './componets/Messenger'
import ProtectRoute from './componets/ProtectRoute';
function App() {
  return (
    <Router >
            <Switch>
                <Route path='/messenger/login' component={Login} exact></Route>
                <Route path='/messenger/register' component={Register} exact></Route>
                <ProtectRoute path='/' component={Messenger} exact/>
            </Switch>
    </Router>
    
  );
}

export default App;
