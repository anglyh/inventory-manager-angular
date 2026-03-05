import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { RegisterPage } from './pages/register-page/register-page';

const authRoutes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'register',
    component: RegisterPage
  },
  {
    path: '**',
    redirectTo: 'login'
  }
]

export default authRoutes;